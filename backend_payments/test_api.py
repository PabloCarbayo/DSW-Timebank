import urllib.request
import json
import time

BASE_URL = "http://127.0.0.1:8000/api/v1/cards"

def make_request(method, url, data=None):
    req = urllib.request.Request(url, method=method)
    if data:
        req.add_header('Content-Type', 'application/json')
        data = json.dumps(data).encode('utf-8')
    try:
        with urllib.request.urlopen(req, data=data) as response:
            return json.loads(response.read().decode())
    except urllib.error.HTTPError as e:
        print(f"HTTP Error {e.code}: {e.read().decode()}")
        return None

def main():
    print("1. Registering a card...")
    card_data = {
        "cardholder_name": "John Doe",
        "card_number": "1234567812345678",
        "expiration_date": "12/28",
        "cvc": "123",
        "initial_balance": 100.0
    }
    res = make_request("POST", f"{BASE_URL}/", card_data)
    print("Response:", res)
    
    time.sleep(1)

    print("\n2. Verifying card...")
    verify_data = {
        "card_number": "1234567812345678",
        "expiration_date": "12/28",
        "cvc": "123"
    }
    res = make_request("POST", f"{BASE_URL}/verify", verify_data)
    print("Response:", res)

    time.sleep(1)

    print("\n3. Processing a payment of $40...")
    payment_data = {
        "card_number": "1234567812345678",
        "expiration_date": "12/28",
        "cvc": "123",
        "amount": 40.0
    }
    res = make_request("POST", f"{BASE_URL}/pay", payment_data)
    print("Response:", res)

    time.sleep(1)

    print("\n4. Getting card details...")
    res = make_request("GET", f"{BASE_URL}/1234567812345678")
    print("Response:", res)

if __name__ == "__main__":
    main()
