# Alerts Service
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
![Version](https://img.shields.io/github/v/release/EnergyConsumptionOptimizer/alerts-service)

The Alerts Service is responsible for managing the full alert lifecycle.
It handles alert creation, retrieval, deletion, read-state management, and real-time alert streaming for authenticated users.
The service also exposes internal endpoints used by other microservices to generate alerts programmatically.

## Technologies Used
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/en/)
[![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)

### Database
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)

### Infrastructure
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docker.com)

### DevOps
[![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=for-the-badge&logo=github-actions&logoColor=white)](https://github.com/features/actions)
[![Docker Hub](https://img.shields.io/badge/Docker_Hub-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://hub.docker.com/)
[![Semantic Release](https://img.shields.io/badge/Semantic_Release-494949?style=for-the-badge&logo=semantic-release&logoColor=white)](https://semantic-release.gitbook.io/)
[![Semantic Versioning](https://img.shields.io/badge/Semantic_Versioning-333333?style=for-the-badge&logo=semver&logoColor=white)](https://semver.org/)
[![Conventional Commits](https://img.shields.io/badge/Conventional_Commits-FE5196?style=for-the-badge&logo=conventionalcommits&logoColor=white)](https://www.conventionalcommits.org/en/v1.0.0/)
[![Renovate](https://img.shields.io/badge/Renovate-1A1F6C?style=for-the-badge&logo=renovate&logoColor=white)](https://renovatebot.com/)

## REST API Endpoints

#### Healthcheck
- `GET /health`

#### Alerts
- `GET /api/alerts`
- `DELETE /api/alerts`
- `GET /api/alerts/:id`
- `DELETE /api/alerts/:id`
- `PATCH /api/alerts/:id`

- `GET /api/alerts/stream`
- `GET /api/alerts/unread-count`

### Internal API

- `POST /api/internal/alerts`

## Authors
- Rares Vasiliu ([rares-vsl](https://github.com/rares-vsl))
- Salvatore Bennici ([SalvatoreBennici](https://github.com/SalvatoreBennici))
