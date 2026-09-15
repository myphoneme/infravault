import os
import requests
from dotenv import load_dotenv

load_dotenv()


def get_github_repositories():
    
    token = os.getenv("GITHUB_TOKEN")
    

    if not token:
        raise Exception("GitHub token is not configured")

    

    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json"
    }

    response = requests.get(
        f"https://api.github.com/user/repos",
        headers=headers,
        params={
            "per_page": 100,
            "sort": "full_name"
        },
        timeout=10
    )

    if response.status_code != 200:
        
        raise Exception(
            f"GitHub API error: {response.status_code}"
        )

    repos = response.json()

    return [
        {
            "id": repo["id"],
            "name": repo["name"],
            "private": repo["private"],
            "html_url": repo["html_url"],
            "language": repo["language"]
        }
        for repo in repos
    ]




