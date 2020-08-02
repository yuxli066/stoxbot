import praw
import json
import os
import sys
from dotenv import load_dotenv
load_dotenv()

# subreddit name and type
subred_name=sys.argv[1]
subred_type=sys.argv[2]

# gilded = subred.gilded(limit=10)
# reddit api credentials
client_id = os.getenv('redditClientId')
client_secret = os.getenv('redditClientSecret')
user_agent = os.getenv('redditUserAgent')
username = os.getenv('redditUsername')
password = os.getenv('redditPassword')

def create_reddit_object():
    return praw.Reddit(client_id=client_id,
                       client_secret=client_secret,
                       user_agent=user_agent,
                       username=username,
                       password=password)

def grab_subreddit_object(redditObj,subreddit_name):
    return redditObj.subreddit(subreddit_name)

def get_subreddit_topics(subredObj,type,max):
    switcher = {
        'hot': subredObj.hot(limit=max),
        'new': subredObj.new(limit=max),
        'top': subredObj.top(limit=max),
        'controv': subredObj.controversial(limit=max)
    }
    return switcher.get(type,lambda: 'Invalid Subreddit Type')

def main():
    reddit = create_reddit_object()
    subred = grab_subreddit_object(reddit,subred_name)

    if len(sys.argv) < 4:
        max_topics = 10
    else:
        max_topics=int(sys.argv[3])

    topics = get_subreddit_topics(subred,subred_type,max_topics)
    return_topics = []
    for item in topics:
        topic = {
            'title': item.title,
            'num_comments': item.num_comments,
            'url': item.url
        }
        return_topics.append(topic)

    print(json.dumps(return_topics))
    sys.stdout.flush()

if __name__ == "__main__":
    main()
