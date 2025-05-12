from youtube_transcript_api import YouTubeTranscriptApi
import sys
import json

def get_video_id(url):
    # Handle different YouTube URL formats
    if 'youtu.be' in url:
        return url.split('/')[-1].split('?')[0]
    elif 'youtube.com' in url:
        if 'v=' in url:
            return url.split('v=')[1].split('&')[0]
    return None

def get_transcript(url, language='en'):
    try:
        video_id = get_video_id(url)
        if not video_id:
            return {"error": "Invalid YouTube URL"}
        
        # Get available transcripts
        transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
        
        # Try to get transcript in requested language
        try:
            transcript = transcript_list.find_transcript([language])
            return {"transcript": transcript.fetch()}
        except:
            # If requested language not available, try to get English transcript
            try:
                transcript = transcript_list.find_transcript(['en'])
                return {"transcript": transcript.fetch()}
            except:
                # If no English transcript, get the first available transcript
                transcript = transcript_list.find_transcript()
                return {"transcript": transcript.fetch()}
                
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Please provide a YouTube URL"}))
        sys.exit(1)
    
    url = sys.argv[1]
    language = sys.argv[2] if len(sys.argv) > 2 else 'en'
    result = get_transcript(url, language)
    print(json.dumps(result)) 