# Getting Started

- Install docker
- Open Docker Desktop
- Run `docker compose up`

*Note: The scanned OMRs (in pdf format) should be placed inside `/backend/inputs/omrs/`. For now the code only supports a location inside the inputs folder. Selecting a different directory will cause unexpected errors.*

## To stop the running containers
- docker compose down

## If you need to make any changes to the code files
- Delete the containers and images using docker UI
- Rerun the app using `docker compose up`
