# Gender & Demographic Profile API

An advanced Node.js backend that aggregates demographic data from multiple sources, classifies information, and persists results.

## Setup & Run

1. Clone & Enter

```bash
git clone <repo-url>
cd <folder>
```

2. Install Dependencies

```bash
npm install
```

3. Start Server

```bash
node index.js
```

Runs at http://localhost:{PORT}

## API Endpoints

- GET `/api`

    Health check. Returns 200 OK.

- GET `/api/classify?name={name}`

    Classifies a name into a gender.

    ### Success Response:

    Response Status: 200

    ```json
    {
    "status": "success",
    "data": {
        "name": "<name>",
        "gender": "female",
        "probability": 0.98,
        "sample_size": 1500,
        "is_confident": true,
        "processed_at": "2026-04-13T20:45:00Z"
    }
    }
    ```

- POST `/api/profiles`

    Request body:

    ```json
        {
            name: String #required
        }
    ```

    Persist creates and persists profile for given name if profile does not exit, otherwise return existing profile.

    ### Success Response:

    1. profile exists

        Response Status: 200

        ```json
        {
            "status": "success",
            "message": "Profile already exits",
            "data": {
                "id": "b3f9c1e2-7d4a-4c91-9c2a-1f0a8e5b6d12",
                "name": "ella",
                "gender": "female",
                "gender_probability": 0.99,
                "sample_size": 1234,
                "age": 46,
                "age_group": "adult",
                "country_id": "DRC",
                "country_probability": 0.85,
                "created_at": "2026-04-01T12:00:00Z"
                }
        }
        ```


    2. profile does not exist

        Response Status: 201

        ```json
        {
            "status": "success",
            "data": {
                "id": "b3f9c1e2-7d4a-4c91-9c2a-1f0a8e5b6d12",
                "name": "ella",
                "gender": "female",
                "gender_probability": 0.99,
                "sample_size": 1234,
                "age": 46,
                "age_group": "adult",
                "country_id": "DRC",
                "country_probability": 0.85,
                "created_at": "2026-04-01T12:00:00Z"
                }
        }
        ```

    ### Error Response:

    Response Status: 
    - `400` : Bad Request
    - `404` : Route not found
    - `422` : Unprocessable Entity
    - `500` : Internal Server Error
    - `502` : Bad Gateway

    ```json
    {
    "status": "error",
    "message": "<error message>"
    }
    ```
