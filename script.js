document.getElementById("startButton").addEventListener("click", function() {
    const numCities = parseInt(document.getElementById("numCities").value);
    if (numCities < 3 || numCities > 500 || isNaN(numCities)) {
        alert("Please enter a valid number of cities between 3 and 500.");
        return;
    }

    const distances = generateDistanceMatrix(numCities);
    const { bestRoute, bestLength } = antColonyOptimization(numCities, distances);

    document.getElementById("bestRoute").textContent = `Best Route: ${bestRoute.join(" -> ")}`;
    document.getElementById("bestLength").textContent = `Best Length: ${bestLength}`;
    visualizeRoute(bestRoute, numCities);
});

function generateDistanceMatrix(numCities) {
    const matrix = Array.from({ length: numCities }, () => Array(numCities).fill(0));
    for (let i = 0; i < numCities; i++) {
        for (let j = i + 1; j < numCities; j++) {
            const distance = Math.floor(Math.random() * (150 - 5 + 1)) + 5;
            matrix[i][j] = matrix[j][i] = distance;
        }
    }
    return matrix;
}

function antColonyOptimization(numCities, distances) {
    const params = {
        alpha: 1.0,
        beta: 5.0,
        rho: 0.5,
        numAnts: 10,
        numIterations: 100,
    };
    let pheromones = Array.from({ length: numCities }, () => Array(numCities).fill(1));
    let bestLength = Infinity;
    let bestRoute = [];

    for (let iteration = 0; iteration < params.numIterations; iteration++) {
        const { routes, lengths } = constructSolutions(numCities, distances, pheromones, params);
        updatePheromones(pheromones, routes, lengths, params);
        const minLength = Math.min(...lengths);
        if (minLength < bestLength) {
            bestLength = minLength;
            bestRoute = routes[lengths.indexOf(minLength)];
        }
    }

    return { bestRoute, bestLength };
}

function constructSolutions(numCities, distances, pheromones, params) {
    const routes = [];
    const lengths = [];

    for (let ant = 0; ant < params.numAnts; ant++) {
        const visited = [Math.floor(Math.random() * numCities)];
        while (visited.length < numCities) {
            const currentCity = visited[visited.length - 1];
            const probabilities = calculateProbabilities(currentCity, visited, distances, pheromones, params);
            const nextCity = selectNextCity(probabilities);
            visited.push(nextCity);
        }
        visited.push(visited[0]); // Return to start
        const length = calculateRouteLength(visited, distances);
        routes.push(visited);
        lengths.push(length);
    }

    return { routes, lengths };
}

function calculateProbabilities(currentCity, visited, distances, pheromones, params) {
    const probabilities = [];
    let total = 0;

    for (let city = 0; city < distances.length; city++) {
        if (!visited.includes(city)) {
            const pheromone = pheromones[currentCity][city] ** params.alpha;
            const heuristic = (1 / distances[currentCity][city]) ** params.beta;
            const probability = pheromone * heuristic;
            probabilities.push(probability);
            total += probability;
        } else {
            probabilities.push(0);
        }
    }

    return probabilities.map(p => p / total);
}

function selectNextCity(probabilities) {
    const rand = Math.random();
    let cumulative = 0;
    for (let i = 0; i < probabilities.length; i++) {
        cumulative += probabilities[i];
        if (rand <= cumulative) return i;
    }
    return probabilities.length - 1;
}

function calculateRouteLength(route, distances) {
    let length = 0;
    for (let i = 0; i < route.length - 1; i++) {
        length += distances[route[i]][route[i + 1]];
    }
    return length;
}

function updatePheromones(pheromones, routes, lengths, params) {
    for (let i = 0; i < pheromones.length; i++) {
        for (let j = 0; j < pheromones[i].length; j++) {
            pheromones[i][j] *= (1 - params.rho);
        }
    }

    for (let r = 0; r < routes.length; r++) {
        const route = routes[r];
        const length = lengths[r];
        for (let i = 0; i < route.length - 1; i++) {
            const from = route[i];
            const to = route[i + 1];
            pheromones[from][to] += 1 / length;
            pheromones[to][from] += 1 / length;
        }
    }
}

function visualizeRoute(route, numCities) {
    const visualization = document.getElementById("visualization");
    visualization.innerHTML = `<p>Route: ${route.join(" -> ")}</p>`;
}
