"""Transparent deterministic skill matching; never use demographic attributes."""
import re

SKILLS = [
    'Java', 'Spring Boot', 'Microservices', 'REST API', 'PostgreSQL', 'MySQL',
    'AWS', 'Azure', 'Python', 'FastAPI', 'React', 'Angular', 'TypeScript',
    'JavaScript', '.NET', 'C#', 'Docker', 'Kubernetes', 'Kafka', 'Redis',
    'CI/CD', 'Jenkins', 'Git', 'Terraform', 'SQL', 'Playwright', 'Selenium',
    'QA', 'Power BI', 'Dataverse', 'Power Apps', 'Azure AI Foundry',
    'LLM', 'RAG', 'pgvector', 'Node.js', 'HTML', 'CSS', 'Linux', 'Security',
    'Payments', 'ISO 8583', 'SWIFT', 'F5', 'Fortinet', 'Dynatrace'
]
ALIASES = {'springboot': 'Spring Boot', 'spring boot': 'Spring Boot',
    'postgres': 'PostgreSQL', 'postgresql': 'PostgreSQL', 'reactjs': 'React',
    'react.js': 'React', 'nodejs': 'Node.js', 'dotnet': '.NET',
    'restful': 'REST API', 'rest apis': 'REST API', 'c sharp': 'C#',
    'k8s': 'Kubernetes', 'ms sql': 'SQL', 'javascript': 'JavaScript',
    'azure ai': 'Azure AI Foundry', 'quality assurance': 'QA'}

def canonical(name):
    key = str(name).strip().lower()
    for s in SKILLS:
        if s.lower() == key: return s
    return ALIASES.get(key, str(name).strip())

def split_skills(value):
    if not value: return []
    if isinstance(value,list): return list(dict.fromkeys(canonical(x) for x in value if x))
    return list(dict.fromkeys(canonical(x) for x in re.split(r'[,;|\n]+',str(value)) if x.strip()))

def detect_skills(text):
    corpus = ' ' + str(text or '').lower() + ' '
    detected = []
    for s in SKILLS:
        pat = r'(?<![a-z0-9])' + re.escape(s.lower()) + r'(?![a-z0-9])'
        if re.search(pat, corpus): detected.append(s)
    for alias, name in ALIASES.items():
        if re.search(r'(?<![a-z0-9])'+re.escape(alias)+r'(?![a-z0-9])',corpus) and name not in detected:
            detected.append(name)
    return detected

def rank_candidate(candidate, required, min_years=0, max_years=None, location='', available_only=False):
    got = {canonical(s).lower(): canonical(s) for s in split_skills(candidate.get('skills',''))}
    want = [canonical(s) for s in split_skills(required)]
    matched = [s for s in want if s.lower() in got]
    missing = [s for s in want if s.lower() not in got]
    years = float(candidate.get('years') or 0)
    min_years = float(min_years or 0)
    max_years = float(max_years) if max_years not in (None, '') else None
    skills_score = (len(matched)/len(want)*65) if want else 30
    if min_years and years < min_years: experience_score = 20 * (years / min_years)
    elif max_years and years > max_years: experience_score = max(5, 20 - (years-max_years)*2)
    else: experience_score = 20
    location_match = not location or location.lower() in str(candidate.get('location') or '').lower()
    location_score = 10 if location_match else 0
    available_match = (not available_only) or str(candidate.get('availability') or '').lower() in ('immediate','0','0 days','available')
    availability_score = 5 if available_match else 0
    score = round(skills_score + experience_score + location_score + availability_score)
    return {'score':score,'matched_skills':matched,'missing_skills':missing,
      'breakdown':{'skills':round(skills_score,1),'experience':round(experience_score,1),
                   'location':location_score,'availability':availability_score},
      'experience_fit':years >= min_years and (max_years is None or years <= max_years),
      'location_fit':location_match,'availability_fit':available_match}
