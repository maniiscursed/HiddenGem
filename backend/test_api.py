import urllib.request
import json

def test():
    # 1. Login
    req = urllib.request.Request(
        "http://127.0.0.1:8000/api/auth/login",
        data=b"username=admin&password=password",
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    try:
        with urllib.request.urlopen(req) as response:
            token = json.loads(response.read())["access_token"]
    except Exception as e:
        print("Login failed:", e)
        return

    # 2. Create Business
    data = json.dumps({
        "name": "Lingamma kirana & general store",
        "category": "Retail",
        "location": "17-2-756 madannapet,saidabad,hyderabad",
        "lat": 17.385,
        "lng": 78.4867,
        "description": "Lingamma Kirana & General Store – Serving the community for over 50 years 🏪 A trusted neighborhood shop known for quality groceries and everyday essentials. Generations of families have relied on us for fresh products and friendly service. Built on trust, tradition, and customer care since day one. Thank you for being part of our journey! 🙏",
        "imageUrl": "http://localhost:8000/uploads/test.jpg"
    }).encode("utf-8")

    req2 = urllib.request.Request(
        "http://127.0.0.1:8000/api/businesses",
        data=data,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}"
        }
    )
    try:
        with urllib.request.urlopen(req2) as response:
            print("SUCCESS:", response.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        print("HTTP Error:", e.code, e.read().decode())
    except Exception as e:
        print("Error:", e)

test()
