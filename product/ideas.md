# Product ideas

The [project brief](../project-brief.md#scope) calls for a product in its own folder in the factory repository. Build the selected idea under `product/` and keep it comparable in scope to the brief's chess example, which breaks the game into roughly a dozen tasks. Track those tasks as issues in this repository and record any task dependencies in the issues.

- **Pantry planner** — Track ingredients and their expiry dates, view what to use soon, and make a shopping list.
- **Study timer** — Run configurable focus and break sessions, log completed sessions by subject, and review weekly totals.
- **Shared expense splitter** — Record who paid for each group expense, split costs among selected people, and show who owes whom.
- **Household inventory** — Record items by room or storage box, search by name, and track items lent to friends.
- **Garden journal** — Log plantings by bed, schedule watering reminders, and record harvest dates and yields.
- **Flashcard trainer** — Create and edit decks, rate recall after each card, and review cards when they are due.
- **Container dashboard** — See which containers are running or stopped on a local Docker host.

  In its simplest form, a local web page shows each container's name, image, and status. When the page loads or the user clicks Refresh, a local backend runs `docker container ls --all --format json` and returns the rows for the table. [Docker container listing](https://docs.docker.com/reference/cli/docker/container/ls/)

  **Feasibility.** Docker already supplies the data, so the first version needs no database. The main dependency is a running Docker Engine that the backend already has permission to query. Keep the dashboard bound to localhost and limit the backend to listing containers. [Docker daemon access](https://docs.docker.com/engine/security/protect-access/)

  **Suitability.** This is a good fit for the factory project if it stays local and read-only. Docker integration, the status table, filtering, and error handling give the factory distinct tasks it can build and test in order. The dashboard's value is quick visual triage, since the CLI already provides the same information.
