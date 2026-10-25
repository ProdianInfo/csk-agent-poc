"""Synthetic-only regression tests for resume extraction and HR corrections."""
from backend.parser import parse_candidate, extract_experience


def test_degree_heading_is_not_candidate_name():
    cv = ("B.E. Computer Science And\n"
          "Career Objective\n"
          "Email: aditi.s@example.invalid\n"
          "Total Experience: 4 years and 6 months\n"
          "Skills: Python PostgreSQL MySQL\n")
    item = parse_candidate('Aditi_Resume.txt', cv.encode('utf-8'))
    assert item['name'] == 'Aditi'
    assert item['years'] == 4.5
    assert item['review_needed'] is True


def test_explicit_name_beats_degree_heading_and_email():
    cv = 'B.Tech Information Technology\nName: Aditi Testperson\n5 years of experience\nJava, Spring Boot'
    item = parse_candidate('candidate_cv.txt', cv.encode())
    assert item['name'] == 'Aditi Testperson'
    assert item['years'] == 5.0


def test_missing_experience_is_flagged_not_fabricated():
    cv = 'Name: Sample Person\nEmail: person@example.invalid\nSkills: Python'
    item = parse_candidate('person.txt', cv.encode())
    assert item['years'] == 0
    assert any('Experience not found' in x for x in item['warnings'])


def test_years_decimal_and_months():
    assert extract_experience('5.5 years of experience') == 5.5
    assert extract_experience('Total work experience: 3 years and 9 months') == 3.75
    assert extract_experience('Education graduated in 2021') is None


def test_hr_corrects_resume_candidate(hr):
    cv = 'B.E. Computer Science And\nEmail: aditi@example.invalid\nPostgreSQL'
    r = hr.post('/api/imports/upload', files=[('files',('Resume.txt',cv.encode(),'text/plain'))])
    assert r.json()['imported'] == 1, r.text
    candidate_id = r.json()['items'][0]['id']
    original = hr.get(f'/api/candidates/{candidate_id}').json()
    assert original['review_needed'] == 1
    assert original['name'] == 'Aditi'
    payload = {'name':'Aditi Testperson','email':original['email'],'phone':'',
               'years':4.5,'skills':'PostgreSQL, Python','location':'Chennai',
               'availability':'30 days','confirmed_against_resume':True}
    assert hr.patch(f'/api/candidates/{candidate_id}',json={**payload,'confirmed_against_resume':False}).status_code==422
    saved = hr.patch(f'/api/candidates/{candidate_id}',json=payload)
    assert saved.status_code == 200,saved.text
    updated = hr.get(f'/api/candidates/{candidate_id}').json()
    assert updated['name'] == 'Aditi Testperson'
    assert updated['years'] == 4.5
    assert updated['review_needed'] == 0
    # Resume bytes and candidate ID remain intact after manual correction.
    assert updated['id'] == candidate_id
    assert hr.get(f'/api/candidates/{candidate_id}/resume').status_code==200
