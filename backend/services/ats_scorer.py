import re
from typing import Dict, List, Set, Tuple
import os
import tempfile

# Simple ATS scorer without NLTK dependency
class ATSScorer:
    def __init__(self):
        # Common stop words (simple list instead of NLTK)
        self.stop_words = set([
            'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours',
            'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', 'her', 'hers',
            'herself', 'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves',
            'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'am', 'is', 'are',
            'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does',
            'did', 'doing', 'a', 'an', 'the', 'and', 'but', 'if', 'or', 'because', 'as', 'until',
            'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into',
            'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down',
            'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here',
            'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more',
            'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so',
            'than', 'too', 'very', 's', 't', 'can', 'will', 'just', 'don', 'should', 'now'
        ])
        
        # Common technical skills for matching
        self.common_skills = [
            'python', 'java', 'javascript', 'react', 'angular', 'vue', 'node', 'express',
            'django', 'flask', 'spring', 'c++', 'c#', 'aws', 'azure', 'gcp', 'docker',
            'kubernetes', 'jenkins', 'sql', 'mongodb', 'postgresql', 'mysql', 'redis',
            'git', 'github', 'gitlab', 'jira', 'agile', 'html', 'css', 'typescript',
            'php', 'ruby', 'swift', 'kotlin', 'machine learning', 'ai', 'data science',
            'tensorflow', 'pytorch', 'excel', 'powerpoint', 'word', 'photoshop'
        ]
    
    def extract_keywords(self, text: str) -> List[str]:
        """Extract important keywords from text"""
        # Convert to lowercase and find words
        words = re.findall(r'\b[a-zA-Z]{3,}\b', text.lower())
        
        # Remove stopwords
        keywords = [w for w in words if w not in self.stop_words]
        
        return keywords
    
    def extract_skills(self, text: str) -> List[str]:
        """Extract technical skills from text"""
        text_lower = text.lower()
        found_skills = []
        
        for skill in self.common_skills:
            if skill in text_lower:
                found_skills.append(skill)
                
        return found_skills
    
    def extract_experience(self, text: str) -> int:
        """Extract years of experience from text"""
        # Look for patterns like "X years experience"
        patterns = [
            r'(\d+)[\+]?\s*(?:plus\s*)?years?\s*(?:of\s*)?experience',
            r'experience\s*(?:of\s*)?(\d+)[\+]?\s*years?',
            r'(\d+)[\+]?\s*yr(?:s)?\.?\s*(?:of\s*)?exp'
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, text.lower())
            if matches:
                try:
                    return int(matches[0])
                except:
                    pass
        
        return 0
    
    def calculate_ats_score(self, resume_text: str, job_description: str) -> Dict:
        """Calculate ATS score and return detailed analysis"""
        
        # Extract keywords from both
        resume_keywords = set(self.extract_keywords(resume_text))
        job_keywords = set(self.extract_keywords(job_description))
        
        # Extract skills
        resume_skills = set(self.extract_skills(resume_text))
        job_skills = set(self.extract_skills(job_description))
        
        # Calculate matches
        matched_keywords = resume_keywords.intersection(job_keywords)
        matched_skills = resume_skills.intersection(job_skills)
        missing_skills = job_skills - resume_skills
        
        # Calculate scores (avoid division by zero)
        keyword_match_score = (len(matched_keywords) / max(len(job_keywords), 1)) * 100
        skill_match_score = (len(matched_skills) / max(len(job_skills), 1)) * 100
        
        # Experience score
        resume_exp = self.extract_experience(resume_text)
        job_exp = self.extract_experience(job_description)
        exp_score = min(100, (resume_exp / max(job_exp, 1)) * 100) if job_exp > 0 else 50
        
        # Overall score (weighted average)
        overall_score = (
            keyword_match_score * 0.3 +
            skill_match_score * 0.5 +
            exp_score * 0.2
        )
        
        # Generate recommendations
        recommendations = []
        if len(missing_skills) > 0:
            missing_list = list(missing_skills)[:5]
            recommendations.append(f"Add these skills to your resume: {', '.join(missing_list)}")
        if exp_score < 70:
            recommendations.append("Highlight your relevant experience more clearly")
        if skill_match_score < 50:
            recommendations.append("Your skills don't match the job requirements well")
        if overall_score < 50:
            recommendations.append("Consider tailoring your resume to this specific job")
            
        return {
            "ats_score": round(overall_score, 2),
            "skills_score": round(skill_match_score, 2),
            "experience_score": round(exp_score, 2),
            "keyword_score": round(keyword_match_score, 2),
            "matched_skills": list(matched_skills),
            "missing_skills": list(missing_skills),
            "recommendations": recommendations,
            "matched_keywords": list(matched_keywords)[:10],
            "total_keywords_matched": len(matched_keywords),
            "total_keywords_required": len(job_keywords)
        }