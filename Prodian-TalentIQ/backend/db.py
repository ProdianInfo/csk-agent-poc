"""SQLite local prototype. DB and storage separate from TELA."""
import sqlite3
import os
import json
import random
from contextlib import contextmanager
from pathlib import Path
DB_PATH=Path(os.environ.get('TALENTIQ_DB_PATH',str(Path(__file__).resolve().parents[1]/'data'/'talentiq.sqlite3')))

def connection():
    DB_PATH.parent.mkdir(parents=True,exist_ok=True)
    conn=sqlite3.connect(str(DB_PATH),timeout=20)
    conn.row_factory=sqlite3.Row
    conn.execute('PRAGMA journal_mode=WAL')
    conn.execute('PRAGMA foreign_keys=ON')
    return conn

@contextmanager
def connect():
    con=connection()
    try:
        yield con
        con.commit()
    finally: con.close()

def rows(con, sql,params=()): return [dict(x) for x in con.execute(sql,params).fetchall()]
def one(con, sql,params=()):
    v=con.execute(sql,params).fetchone();return dict(v) if v else None

def initialize():
    with connect() as con:
        con.executescript('''
        CREATE TABLE IF NOT EXISTS candidates (
          id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL,
          email TEXT DEFAULT '',phone TEXT DEFAULT '', location TEXT DEFAULT '',
          years REAL DEFAULT 0,skills TEXT DEFAULT '', availability TEXT DEFAULT '30 days',
          source TEXT DEFAULT 'manual', resume_file TEXT DEFAULT '',resume_hash TEXT DEFAULT '',
          parse_method TEXT DEFAULT '', review_needed INTEGER DEFAULT 0,
          status TEXT DEFAULT 'New', extracted_text TEXT DEFAULT '', created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
        CREATE INDEX IF NOT EXISTS ix_candidate_email ON candidates(email);
        CREATE INDEX IF NOT EXISTS ix_candidate_resume ON candidates(resume_hash);
        CREATE TABLE IF NOT EXISTS jobs(id INTEGER PRIMARY KEY AUTOINCREMENT,title TEXT NOT NULL,
          skills TEXT DEFAULT '',min_years REAL DEFAULT 0,max_years REAL,location TEXT DEFAULT '',
          description TEXT DEFAULT '',status TEXT DEFAULT 'Open',created_at TEXT DEFAULT CURRENT_TIMESTAMP);
        CREATE TABLE IF NOT EXISTS imports(id INTEGER PRIMARY KEY AUTOINCREMENT,filename TEXT NOT NULL,
          source TEXT NOT NULL,result TEXT NOT NULL,detail TEXT DEFAULT '',method TEXT DEFAULT '',
          candidate_id INTEGER,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
        CREATE TABLE IF NOT EXISTS incidents(id INTEGER PRIMARY KEY AUTOINCREMENT,kind TEXT NOT NULL,
          title TEXT NOT NULL,severity TEXT DEFAULT 'medium',status TEXT DEFAULT 'open',
          trace_id TEXT DEFAULT '',details TEXT DEFAULT '',created_at TEXT DEFAULT CURRENT_TIMESTAMP);
        CREATE TABLE IF NOT EXISTS audit(id INTEGER PRIMARY KEY AUTOINCREMENT,actor TEXT,action TEXT,
          resource TEXT,detail TEXT DEFAULT '',created_at TEXT DEFAULT CURRENT_TIMESTAMP);
        CREATE TABLE IF NOT EXISTS approvals(id INTEGER PRIMARY KEY AUTOINCREMENT,action TEXT NOT NULL,
          target_id INTEGER NOT NULL,status TEXT DEFAULT 'pending',requested_by TEXT,
          approved_by TEXT DEFAULT '',created_at TEXT DEFAULT CURRENT_TIMESTAMP);
        CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY,value TEXT NOT NULL);
        ''')
        if not one(con,'SELECT id FROM candidates LIMIT 1'): seed(con)
        if not one(con,'SELECT id FROM jobs LIMIT 1'):
            for title,skills,lo,hi,location,desc in [
              ('Java Backend Developer','Java, Spring Boot, PostgreSQL, REST API',3,6,'Chennai','Experience with banking APIs preferred'),
              ('Azure AI Engineer','Python, Azure, Azure AI Foundry, RAG',4,8,'Chennai','Build secure AI services'),
              ('Frontend Engineer','React, TypeScript, REST API',2,5,'Chennai','Responsive HR and enterprise UI'),
              ('QA Automation','QA, Playwright, Selenium',2,6,'Chennai','Test automation and quality gates')]:
                con.execute('INSERT INTO jobs(title,skills,min_years,max_years,location,description) VALUES(?,?,?,?,?,?)',
                   (title,skills,lo,hi,location,desc))

def seed(con):
    rnd=random.Random(27)
    first=['Arun','Meera','Kavin','Divya','Nithin','Priya','Rohit','Ananya','Sanjay','Ishita','Deepak','Keerthi','Vikram','Swetha','Harish','Nisha','Bala','Riya','Dinesh','Pooja']
    last=['Rao','Menon','Kumar','Iyer','Nair','Shah','Krishnan','Reddy','Verma','Raj']
    tracks=[['Java','Spring Boot','PostgreSQL','REST API','Microservices','Docker'],
      ['Python','Azure','Azure AI Foundry','RAG','pgvector','FastAPI'],
      ['React','TypeScript','JavaScript','REST API','CSS'],
      ['QA','Playwright','Selenium','Java','Git'],
      ['Java','Spring Boot','Kafka','Redis','Kubernetes'],
      ['.NET','C#','SQL','Azure','Docker']]
    for i in range(1,49):
        name=first[(i-1)%len(first)]+' '+last[(i*3)%len(last)]
        skills=tracks[(i-1)%len(tracks)][:] +rnd.sample(['AWS','CI/CD','Git','Linux','SQL','Security','Terraform'],2)
        years=rnd.choice([2,3,4,5,6,7,8,10])
        con.execute('''INSERT INTO candidates(name,email,phone,location,years,skills,availability,
          source,status,review_needed,extracted_text) VALUES(?,?,?,?,?,?,?,?,?,?,?)''',
           (name, f'candidate{i:03d}@example.invalid',f'0000000{i:03d}',rnd.choice(['Chennai','Bengaluru','Hyderabad','Remote']),
            years,', '.join(skills),rnd.choice(['Immediate','15 days','30 days','60 days']),
            'synthetic',rnd.choice(['New','Shortlisted','Interview','New','New']),0,
            f'SYNTHETIC PROFILE {name}; Experience {years} years; skills: {", ".join(skills)}.'))
