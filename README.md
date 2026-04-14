# Gender Classifier API

A lightweight Node.js service to process gender predictions with custom validation and confidence logic.

## Setup & Run
1. Clone & Enter

```bash
git clone <repo-url>
cd <folder>
```

2. Install Dependencies
```bash
npm install express cors
```

3. Start Server
```bash
node index.js
```

Runs at http://localhost:{PORT} 

## API Endpoints
GET `/api`

Health check. Returns 200 OK.

GET `/api/classify?name={name}`

Classifies a name.

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

### Error Response:

Response Status: 400/422/500/502 
```json
{ 
    "status": "error", 
    "message": "<error message>" 
}
```
