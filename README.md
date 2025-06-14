# Rust Wheel Spin Tracker
#### Video Demo:  https://www.youtube.com/watch?v=M8uhaFS9Yoo&ab_channel=Andy
#### Description:

## Outline

1. Introduction
2. Backend (Flask + Database)
3. Frequency Calculation
4. Frontend & UI
5. JavaScript & Interactivity
6. Chart Visualization
7. Data Management (Reset/Backup)
8. Conclusion

## Introduction

This is a web-based application that tracks the results of spins in a gambling game, specifically the "Rust" game, and compares actual outcomes with their theoretical probabilities. It has been built using Python (Flask) on the backend, JavaScript for the front end, and SQLite for data storage. The goal is to demonstrate how the outcomes distribute over time and to find differences between observed frequencies and expected percentages (e.g., if a number should appear 48% of the time, how far off is the actual data?). In a nutshell, the core idea is that there are some that I call just "statistical anomalies" that deviate from the theoretical value **TOO MUCH**. If that happens, you can start betting on them, and that's how I won bags of in-game currency. The project itself showcases an understanding of full-stack web development and backed implementation.

## Backend (Flask + Database)

I will begin with the core part of the application. On the server side, we have the heart of my application: Flask. Flask is a Python web framework used to define routes for our API. I configured Flask with flask_sqlalchemy to use an SQLite database to store our outputs from Rust. I have integrated two database models, `Spin` and `SpinBackup,` to map directly to the corresponding tables. With that, we can work purely with Python and avoid using raw SQL syntaxis; winch simplifies the coding and database build, for instance, when we initiate `db.session.add(spin)` and `db.session.commit()`, SQLAlchemy translates these Python operations into SQL commands.

I defined several API endpoints in Flask:
 - `GET /spins`: Returns all recorded spins in a designated order as JSON file.
 - `POST /spins`: Accepts a JSON body with a "result" field, creates a new Spin record, and stores it into the database. The server reads the JSON payload with `request.get_json()`, which parses the incoming JSON data into a Python dictionary. If the JSON is malformed or missing, Flask will automatically return a 400 error.
 - `DELETE /spins/<index>`: Deletes a spin by its index in the ordered list; we query all spins and remove the one at that index, and then commit a change.
 - `POST /reset`: This was a bit challenging to implement, but it essentially backs up all spins to both a new SpinBackup table and a JSON file (utilizing Python's JSON library), then clears the original Spin table and refreshes all columns.
 - `GET /stats`: Calls a utility function to compute statistics and returns a JSON object with frequency data.

These routes together form a simple `RESTful API.` (The `@app.route` handlers use JSONify or Python dicts so that the client receives data in JSON format.)

## Frequency Calculation

Another essential part of the project is analyzing how often each spin result appears and calculating the data being processed. The Python function `calculate_frequencies(spins)` that takes a list of spin results and returns two dictionaries of percentages: one mapping each Number to its actual occurrence percentage, and another mapping colors (red means negative value, black means equal to theoretical value and green means higher than theoretical value) to percentages. The approach is straightforward: we first count occurrences of each Number; although our code manually increments count in a dict, you could also use Python's collections. The Counter class is designed for this exact purpose. A Counter takes an iterable and tallies how many times each element appears. For example:

 from collections import Counter
 counts = Counter([1,3,5,1,5,5])

 // counts == {5: 3, 1: 2, 3: 1}

The Counter gives us just the raw hit counts. We then divide by the total Number of spins to get percentages. The code also puts and sorts each Number by color (explained earlier). Finally, we compute each percentage as (count/total) * 100. (also avoids division by zero). By comparing the Actual percentage (computed) with the Theory percentage (predefined target probabilities or theoretical), the application shows the `"Diff"` column. This highlights whether an outcome is over or under the theoretical value in the observed data. For example, if number 1 appears in 24% of spins but the theory predicts 48%, the Diff would show -24.00%. This deviation between real and expected frequencies could indicate non-random behavior or statistical variance.

## Frontend and UI

The HTML interface provides a common and clean user experience for inputting spins, viewing statistics, and utilizing custom CSS. The page features a title and a row that displays the total spins and a countdown timer (the feature itself has no use; it's a timer for an in-game feature to indicate how much time is left before the next spins start). Below that is a table with headers ` Number,` `Hits,` `Actual %,` `Theory %,` and `Diff.` Each row of the table (one per possible Number) is populated dynamically with JavaScript. Initially, the table body `(<tbody>)` is empty; our script fills it in by inserting rows with the latest data, while the table's CSS makes it responsive and styled, using simple, not flashy colors for clarity.

There are buttons below the table and a scroller. The user can type a spin result into the flown (must be one of the allowed numbers: 1, 3, 5, 10, or 20 (Both are protected from wrong miss input, on the backend as well as on the javascript side)) and click "Add Spin"` to submit it. I love optimized websites that have native, intuitively logical support for short keys; that's why I also found a solution and attached an `onkeydown handler` so that pressing Enter triggers submission as well, which is very helpful when I want to input a large amount of data manually. The slider and delete button form allows the user to review or remove spins; the slider's maximum value is set to the total Number of spins, and moving it shows which spin number (and timestamp) is selected. Pressing `"Delete Spin"` calls the DELETE endpoint on the currently selected spin.

We do not reload the page when data changes. Instead, after any action (adding or deleting a spin), the script fetches fresh data from /spins. It updates the table, as well as the total count and the slider label. This dynamic update model keeps the UI and backend in sync.

## JavaScript and Interactivity

Our script.js handles all of the user interactions.

 - `submitSpin()`: It basically reads the Number from the input field, validates it with the allowed targets `(1, 3, 5, 10, 20)`, and then sends it to the server. It uses the `fetch()` API to POST a JSON payload like {"result": 5} to /spins. This ensures Flask recognizes the incoming data as JSON. Upon success, it clears the input, restarts the 60-second timer, and then calls `refreshData()` and `updateStats()` to refresh the display and charts, displaying the values on the charts to the user.
 - `refreshData()`: Sends a GET request to /spins to retrieve the full spin history.
 - `updateDisplay()`: Redraws the HTML table and updates the slider. It counts how many times each target number appears, computes the `"Actual %"` for each, and fills table rows with <tr> HTML. For each number row, it also colors the text green/red/black depending on whether the actual percentage is above or below the target (the ternary diff > 0 ? 'green': 'red' logic). Then, it updates the slider's max and value to the current total. If there are no spins, the slider is disabled and shows "No spins recorded."
 - Slider & deletion: When the slider is moved, `updateSliderLabel()` shows which spin is selected by looking up spins[pos-1]. The `"Delete Spin"` button uses `deleteSpin(),` which computes the index (value - 1) and calls DELETE /spins/<index>. After deletion, it refreshes data and stats.
 For all server interactions, I have used the modern JavaScript Fetch API. As the Flask docs explain:" `fetch()` returns a Promise and can be awaited." I read and followed patterns from Flask's documentation, e.g., setting headers and using JSON.stringify when sending the actual data. On the Flask side, `request.get_json()` was used (or request.json) to retrieve the sent data.

## Chart Visualization

To visualize the data, I used Chart.js, a popular open-source charting library for JavaScript that was very supported on Reddit. Chart.js can create bar charts, line charts, and many more. (Using HTML5 canvas). In the app, you can find a prepared bar chart to show the frequency of each Number result for a more visually pleasing display of the data. The chart's labels are the spin values (1,3,5,10,20), and the bar heights are the actual frequency percentages, as returned by the /stats endpoint. (I also set up an empty color chart and martingaleChart canvases in the HTML for the features that were not implemented yet; I thought that the project itself would be too big and left some things behind).

In the function `updateStats(),` we fetch the /stats JSON, extract number_freq (a mapping of Number to % frequency), and assign its keys and values to `numberChart.data.labels` and `datasets[0].data`, then we call `numberChart.update()` to redraw.

## Data Management (Reset/Backup)

The `Reset` button was a last-minute solution because I wanted to try some new values, and deleting the .db file every time was unprofessional. That's why I implemented this button to save the data and just reset the whole chart, in other words, to clear the database while preserving a backup. When the user clicks `"🔄 Refresh,"` the app confirms and then posts to /reset. The Flask route for /reset iterates over all Spin records, copying each into a SpinBackup table together with the original timestamp, where this archive table could be queried later if needed. Additionally, it writes a JSON file with the following syntax: "`backup_spins_YYYY-MM-DD_HH-MM-SS.json`" that contains all spins and timestamps.

After backing up, the code deletes all rows from the original Spin table and commits the transaction. A success message is returned to the client upon completion, and the front end reloads the data state to its initial empty state.

## Conclusion

To summarize, this CS50 final project has utilized many course concepts that were explained throughout this long journey. I built a web app with a Python/Flask backend and a JavaScript frontend that stores data in an SQL database using SQLAlchemy. The app solves the problem of tracking and visualizing outcomes in a game of chance, summarizing abstract practical data into a comprehensive analytical summary. I always told myself that there is no genuine randomness in the game; there is always a pattern that can be cracked and exploited; this is exactly what moved me forward, explaining this fascinating world of Data analysis and deep thinking, finding solutions to problems and in the end win some in-game currency, It solves a fundamental question. It is a complete, functional application – precisely what the CS50 final project rubric encourages. A huge thank you to the CS50 team for bringing this free online course to life and allowing me to learn and earn something.


Sources: General references and documentation were consulted to ensure best practices (e.g., Flask fetch/JSON patterns, SQLAlchemy ORM usage, Python Counter for frequencies, and Chart.js bar chart concepts) + Help of ChatGPT and other models with some minor help in naming, functionality fixing and structure.
