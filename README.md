# Demographic Profile Intelligence Engine API

An advanced Node.js backend that aggregates demographic data from multiple sources, classifies information, and persists results.

Our API features a custom-built Natural Language Query (NLQ) engine that translates unstructured English phrases into structured query filters. This allows users to search for "Young Nigerian women" instead of manually constructing query parameters

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

- GET `/api/profiles`

  Fetches a paginated list of profiles with support for advanced demographic filtering and sorting.
  
  ### Query Parameters

  |Parameter|Type|Description|
  |---|---|---|
  |gender|string|Filter by male or female.|
  |age_group|string|Filter by child, teenager, adult, or senior.|
  |country_id|string|Filter by 2-letter ISO country code (e.g., NG, US).|
  |min_age|number|Minimum age (inclusive).|
  |max_age|number|Maximum age (inclusive).|
  |sort_by|string|Field to sort by (e.g., age, name, created_at). Default: created_at.|
  |order|string|asc or desc. Default: desc.|
  |page|number|Page number for pagination. Default: 1.|
  |limit|number|Records per page (Max 50). Default: 10.|

  ### Example Request
  `GET /api/profiles?gender=female&country_id=NG&sort_by=age&order=asc`

  ### Example Response (200 OK)

  ```json
  JSON{
    "status": "success",
    "page": 1,
    "limit": 10,
    "total": 42,
    "data": [
      {
        "id": "018e1234-5678-7000-8000-000000000000",
        "name": "amaka adeleke",
        "gender": "female",
        "age": 24,
        "age_group": "adult",
        "country_id": "NG",
        "country_name": "Nigeria",
        "created_at": "2026-04-20T10:00:00.000Z"
      },
      ...
    ]
  }
  ```

- GET `/api/profiles/search`

  The "Intelligence" endpoint. Uses Natural Language Processing to extract filters from a plain English string.

  ### Query Parameters
  |Parameter|Type|Required|Description|
  |---|---|---|---|
  |q|string|Yes|The search string (e.g., "Young Nigerians", "Adults above 30 from UK").|
  |page|number|No|Page number for pagination.|
  |limit|number|No|Records per page.|

  ### Example Request
  `GET /api/profiles/search?q=females from Ghana above 20`

  ### Example Response (200 OK)

  Note: If no profiles match the interpreted filters, the API returns a success status with an empty data array.
  ```json
  JSON{
    "status": "success",
    "page": 1,
    "limit": 10,
    "total": 13,
    "data": [
      {
        "id": "018e9999-1111-7000-8000-000000000000",
        "name": "kwame mensah",
        "gender": "male",
        "age": 22,
        "country_id": "GH",
        "country_name": "Ghana"
      },
      ...
    ]
  }
  ```
  ### Error Response (400 Bad Request)

  Returned if the q parameter is missing or if the engine cannot identify any valid demographic tokens.

  ```json
  JSON{
    "status": "error",
    "message": "Query parameter 'q' is required"
  }
  ```

  
### Error Response:

  Response Status:
  - `400` : Bad Request
  - `404` : Route not found
  - `422` : Unprocessable Entity
  - `500` : Internal Server Error
  - `502` : Bad Gateway

### Error Response Structure
  ```json
  {
    "status": "error",
    "message": "<error message>"
  }
  ```

## Natural Language Parsing Approach & Logic

The engine follows a Tokenization and Greedy-Match strategy:

**Normalization**: All incoming queries are lowercased and stripped of special punctuation to ensure consistent matching.

**Keyword Mapping**: We use a dictionary-based lookup for demographics and a comprehensive mapping for global geography.

**The "Greedy" Algorithm**: For geographic locations, the parser sorts all possible country names and demonyms by length. It attempts to match the longest phrases first (e.g., "United Arab Emirates") before shorter tokens (e.g., "United") to prevent partial-match errors.

**Logical Resolution**: The engine identifies multiple tokens of the same type. For example, a query for "Ghana and/or Nigeria" identifies both country codes and automatically converts them into a database `OR` query.

### Supported Keywords & Filters

| Filter Category | Supported Keywords (Triggers) | Mapping Logic |
| --------------- | ----------------------------- | ------------- |
| Gender | male(s), men, boy(s), guy(s), gentlemen, gentleman | Maps to male |
| Gender | female(s), woman, girl(s), lady, ladies | Maps to female |
| Age Groups | child, children, kid(s), infant(s) | Maps to child |
| Age Groups | teen(s), teenager(s), adolescent(s) | Maps to teenager |
| Age Groups | adult(s), grown-up(s) | Maps to adult |
| Age Groups | senior(s), elderly, retired, old people | Maps to senior |
| Numeric Age | under, below, younger than + `[number]` | matches Age equal or lesser than `[number]` |
| Numeric Age | above, over, older than + `[number]` | matches Age equal or greater than `[number]` |
| Special Age Range | young, youth | Strictly maps to ages in range 16–24 |
| Geography | 250+ Country names (e.g., Japan) and Demonyms (e.g., Japanese) | Maps to ISO-2 codes (e.g., JP) |

## 3. Limitations & Edge Cases

While the engine is robust for demographic searches, the following limitations apply:

- **Negation Logic**: The parser does not currently support "NOT" filters (e.g., "People not from Nigeria"). It only identifies inclusive tokens.
- **Fuzzy Matching**: We rely on exact keyword matches. Common misspellings (e.g., "Nigera") will not trigger a filter unless they are explicitly added to the dictionary.

- **Superlatives & Aggregations**: Complex analytical queries such as "the oldest person," "average age," or "most common country" are not supported.

- **Ambiguous Context**: In phrases where a country name is also a common noun, the engine may produce a false positive. However, we mitigate this using Word Boundary Regex (\b) to ensure we only match whole words.

- **Pluralization**: While we handle common plural demonyms (e.g., "Germans"), complex irregular plurals may default to the singular lookup.
