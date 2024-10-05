# Getting Started

- Install docker
- Check if docker desktop is running fine
  - Open command prompt/terminal and run `docker --version`
  - It should show output similar to below
    
   ![image](https://github.com/user-attachments/assets/7e104c65-f150-4bda-9f21-ec15dd0ebb39)
- Open Docker Desktop
- Run `docker compose up`

*Note: The scanned OMRs (in pdf format) should be placed inside `/backend/inputs/omrs/`. For now the code only supports a location inside the inputs folder. Selecting a different directory will cause unexpected errors.*

## To stop the running containers
- docker compose down

## If you need to make any changes to the code files
- Delete the containers and images using docker UI
- Rerun the app using `docker compose up`
