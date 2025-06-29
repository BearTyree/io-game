# IO Game by Bear Tyree (name tbd)

### Description

This is a simple IO game where players spawn in a cave map with "pew pew squares" and must hit eachother with the squares to get kills. Matches last four minutes and fourty seconds with twenty seconds of the final leaderboard being displayed. Players are given infinite shots as well as a double jump to make for fast paced gameplay.

### Tech Stack

The game was built with PhaserJs. The websocket server is a durable object with the id "main" so that all players are in the same server; this leaves room to easily exapand to regional and load based distribution if this game was to get popular. The matches are started using a worker cron job that runs every five minutes.
