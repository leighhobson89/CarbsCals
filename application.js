// Global variable to store all food data
let allFoods = [];

// Global variable to store max daily carbs for keto
let maxDailyCarbs = null;

// Global variable to store the current sort option
let currentSortOption = 'alphabetical';

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Load food data from CSV file
    loadFoodData();

    // Set up event listeners for all filter dropdowns
    setupEventListeners();
});

/**
 * Load food data from CSV file using fetch API
 */
function loadFoodData() {
    fetch('data/foodData.csv')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();
        })
        .then(csvText => {
            allFoods = parseCSVToFoods(csvText);
            // Populate dropdowns once data is loaded
            populateDropdowns();
            // Display all foods initially
            displayFoods(allFoods);
            // Apply keto coloring if max carbs is set
            colorFoodCardsBasedOnKeto();
        })
        .catch(error => {
            console.error('Error loading food data:', error);
            displayError('Failed to load food data. Please check the console for details.');
        });
}

/**
 * Populate all dropdown menus with unique values from the dataset
 */
function populateDropdowns() {
    // Get unique food names and sort them alphabetically
    const foodNames = [...new Set(allFoods.map(food => food.name))].sort();

    // Get unique categories and sort them alphabetically
    const categories = [...new Set(allFoods.map(food => food.category))].sort();

    // Populate food name dropdown
    const foodNameSelect = document.getElementById('foodName');
    foodNames.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        foodNameSelect.appendChild(option);
    });

    // Populate category dropdown
    const categorySelect = document.getElementById('categoryFilter');
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categorySelect.appendChild(option);
    });
}

/**
 * Set up event listeners for all filter dropdowns
 */
function setupEventListeners() {
    // Add change event listeners to all filter dropdowns
    document.getElementById('foodName').addEventListener('change', filterFoods);
    document.getElementById('carbsFilter').addEventListener('change', filterFoods);
    document.getElementById('caloriesFilter').addEventListener('change', filterFoods);
    document.getElementById('categoryFilter').addEventListener('change', filterFoods);

    // Add event listener for sort dropdown
    document.getElementById('sortBy').addEventListener('change', function() {
        currentSortOption = this.value;
        filterFoods();
    });

    // Add event listener for theme dropdown
    document.getElementById('themeSelect').addEventListener('change', function() {
        document.documentElement.setAttribute('data-theme', this.value);
    });

    // Add event listener for search input
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', function() {
        // Only filter if search term has 3 or more characters
        if (searchInput.value.length >= 3) {
            filterFoods();
        } else if (searchInput.value.length === 0) {
            // If search is cleared, also refilter
            filterFoods();
        }
    });

    // Add event listeners for max carbs input
    const maxCarbsInput = document.getElementById('maxCarbsInput');
    maxCarbsInput.addEventListener('blur', updateMaxDailyCarbs);
    maxCarbsInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            updateMaxDailyCarbs();
        }
    });
}

/**
 * Filter foods based on current dropdown selections and search input, then display results
 */
function filterFoods() {
    // Get current filter values
    const selectedFoodName = document.getElementById('foodName').value;
    const selectedCarbsFilter = document.getElementById('carbsFilter').value;
    const selectedCaloriesFilter = document.getElementById('caloriesFilter').value;
    const selectedCategoryFilter = document.getElementById('categoryFilter').value;
    const searchTerm = document.getElementById('searchInput').value.trim();

    // Start with all foods and apply filters progressively
    let filteredFoods = allFoods;

    // Filter by food name (exact match)
    if (selectedFoodName) {
        filteredFoods = filteredFoods.filter(food => food.name === selectedFoodName);
    }

    // Filter by carbs range
    if (selectedCarbsFilter) {
        filteredFoods = filteredFoods.filter(food => {
            switch (selectedCarbsFilter) {
                case 'very-low':
                    return food.carbs < 10;
                case 'low':
                    return food.carbs >= 10 && food.carbs < 20;
                case 'medium-low':
                    return food.carbs >= 20 && food.carbs < 30;
                case 'medium':
                    return food.carbs >= 30 && food.carbs < 40;
                case 'medium-high':
                    return food.carbs >= 40 && food.carbs < 50;
                case 'high':
                    return food.carbs >= 50;
                default:
                    return true;
            }
        });
    }

    // Filter by calories range
    if (selectedCaloriesFilter) {
        filteredFoods = filteredFoods.filter(food => {
            switch (selectedCaloriesFilter) {
                case 'low':
                    return food.calories < 200;
                case 'medium':
                    return food.calories >= 200 && food.calories <= 500;
                case 'high':
                    return food.calories > 500;
                default:
                    return true;
            }
        });
    }

    // Filter by category (exact match)
    if (selectedCategoryFilter) {
        filteredFoods = filteredFoods.filter(food => food.category === selectedCategoryFilter);
    }

    // Filter by search term (only if 3 or more characters)
    if (searchTerm.length >= 3) {
        const searchLower = searchTerm.toLowerCase();
        filteredFoods = filteredFoods.filter(food =>
            food.name.toLowerCase().includes(searchLower)
        );
    }

    // Sort the filtered results
    sortFoods(filteredFoods, currentSortOption);

    // Display the filtered and sorted results
    displayFoods(filteredFoods);

    // Color the displayed cards based on keto limits
    colorFoodCardsBasedOnKeto();
}

/**
 * Sort the foods array based on the specified sort option
 * @param {Array} foods - Array of food objects to sort
 * @param {string} sortOption - The sort option ('alphabetical', 'carbs-high-low', etc.)
 */
function sortFoods(foods, sortOption) {
    foods.sort((a, b) => {
        switch (sortOption) {
            case 'alphabetical':
                return a.name.localeCompare(b.name);
            case 'carbs-high-low':
                return b.carbs - a.carbs;
            case 'carbs-low-high':
                return a.carbs - b.carbs;
            case 'calories-high-low':
                return b.calories - a.calories;
            case 'calories-low-high':
                return a.calories - b.calories;
            case 'fat-high-low':
                return b.fat - a.fat;
            case 'fat-low-high':
                return a.fat - b.fat;
            default:
                return 0;
        }
    });
}

/**
 * Display foods in the results container
 * @param {Array} foods - Array of food objects to display
 */
function displayFoods(foods) {
    const resultsContainer = document.getElementById('resultsContainer');

    if (!resultsContainer) {
        console.error('Results container not found!');
        return;
    }

    // Clear previous results
    resultsContainer.innerHTML = '';

    // If no foods match the filters, show a message
    if (foods.length === 0) {
        const noResultsDiv = document.createElement('div');
        noResultsDiv.className = 'no-results';
        noResultsDiv.textContent = 'No foods match the selected filters. Try adjusting your criteria.';
        resultsContainer.appendChild(noResultsDiv);
        return;
    }

    // Create a card for each food item
    foods.forEach(food => {
        const foodCard = document.createElement('div');
        foodCard.className = 'food-card';

        // Create the food card HTML structure
        foodCard.innerHTML = `
            <h3>${food.name}</h3>
            <p class="food-category">${food.category}</p>
            <div class="food-info">
                <div class="food-info-item">
                    <span class="food-info-label">Carbs:</span>
                    <span class="food-info-value">${food.carbs}g</span>
                </div>
                <div class="food-info-item">
                    <span class="food-info-label">Calories:</span>
                    <span class="food-info-value">${food.calories} kcal</span>
                </div>
                <div class="food-info-item">
                    <span class="food-info-label">Fat:</span>
                    <span class="food-info-value">${food.fat}g</span>
                </div>
                <div class="food-info-item">
                    <span class="food-info-label">Protein:</span>
                    <span class="food-info-value">${food.protein}g</span>
                </div>
                <div class="food-info-item">
                    <span class="food-info-label">Cholesterol:</span>
                    <span class="food-info-value">${food.cholesterol}mg</span>
                </div>
            </div>
        `;

        resultsContainer.appendChild(foodCard);
    });
}

/**
 * Determine the appropriate color for a food card based on max daily carbs limit
 * @param {Object} food - The food object with carbs property
 * @returns {string} - The color to apply ('green', 'orange', 'red', or null for no color)
 */
function getCardColor(food) {
    if (maxDailyCarbs === null) {
        return null; // No coloring if no max carbs set
    }

    const foodCarbs = food.carbs;

    if (maxDailyCarbs < foodCarbs) {
        return 'red'; // Too many carbs for keto limit
    } else if (maxDailyCarbs < foodCarbs * 1.2) {
        return 'orange'; // Close to keto limit (within 20%)
    } else {
        return 'green'; // Well under keto limit
    }
}

/**
 * Color all currently displayed food cards based on keto limits
 */
function colorFoodCardsBasedOnKeto() {
    if (maxDailyCarbs === null) {
        // Clear any existing color classes if no max carbs set
        colorFoodCards(null);
        return;
    }

    const foodCards = document.querySelectorAll('.food-card');

    foodCards.forEach(card => {
        // Get the food name from the card
        const foodName = card.querySelector('h3').textContent;

        // Find the corresponding food object
        const food = allFoods.find(f => f.name === foodName);

        if (food) {
            const cardColor = getCardColor(food);

            // Remove existing color classes
            card.classList.remove('card-green', 'card-orange', 'card-red');

            // Apply new color class if one is determined
            if (cardColor) {
                card.classList.add(`card-${cardColor}`);
            }
        }
    });
}

/**
 * Change the color of food cards based on the specified color scheme
 * @param {string} color - The color to apply ('green', 'orange', 'red')
 */
function colorFoodCards(color) {
    const foodCards = document.querySelectorAll('.food-card');

    foodCards.forEach(card => {
        // Remove existing color classes
        card.classList.remove('card-green', 'card-orange', 'card-red');

        // Apply new color class based on parameter
        if (color) {
            card.classList.add(`card-${color}`);
        }
    });
}

/**
 * Update the global maxDailyCarbs variable when user enters a value
 */
function updateMaxDailyCarbs() {
    const maxCarbsInput = document.getElementById('maxCarbsInput');
    const value = maxCarbsInput.value.trim();

    if (value === '' || value === null) {
        maxDailyCarbs = null;
        console.log('Max daily carbs cleared');

        // Clear any keto-based coloring from existing cards
        colorFoodCardsBasedOnKeto();
        return;
    }

    const numericValue = parseInt(value, 10);

    if (isNaN(numericValue) || numericValue < 0) {
        alert('Please enter a valid positive number for max daily carbs.');
        maxCarbsInput.value = maxDailyCarbs !== null ? maxDailyCarbs : '';
        return;
    }

    maxDailyCarbs = numericValue;
    console.log(`Max daily carbs set to: ${maxDailyCarbs}`);

    // Color existing cards based on the new keto limit
    colorFoodCardsBasedOnKeto();

    // Optional: You could add visual feedback here
    // For example, show a brief success message or highlight the input
}

/**
 * Display an error message in the results container
 * @param {string} message - Error message to display
 */
function displayError(message) {
    const resultsContainer = document.getElementById('resultsContainer');
    resultsContainer.innerHTML = `
        <div class="no-results">
            <strong>Error:</strong> ${message}
        </div>
    `;
}

/**
 * Parse CSV data and convert it to food objects
 * @param {string} csvText - Raw CSV text to parse
 * @returns {Array} - Array of food objects
 */
function parseCSVToFoods(csvText) {
    // Handle both Windows (CR LF) and Unix (LF) line endings
    const lines = csvText.split(/\r?\n/);

    const foods = [];

    // Skip header lines (first 3 lines are headers/metadata)
    for (let i = 3; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue; // Skip empty lines

        // Parse CSV line properly handling quoted fields
        const fields = parseCSVLine(line);

        if (fields.length >= 9) { // Ensure we have at least 9 fields (including category)
            const food = {
                name: fields[0].replace(/"/g, '').trim(),
                protein: (fields[1] === 'Tr' || fields[1] === 'N') ? 0.1 : (parseFloat(fields[1]) || 0),
                fat: (fields[2] === 'Tr' || fields[2] === 'N') ? 0.1 : (parseFloat(fields[2]) || 0),
                carbs: (fields[3] === 'Tr' || fields[3] === 'N') ? 0.1 : (parseFloat(fields[3]) || 0),
                calories: parseInt(fields[4]) || 0,
                category: fields[8].replace(/"/g, '').trim(),
                cholesterol: (fields[7] === 'Tr' || fields[7] === 'N') ? 0.1 : (parseFloat(fields[7]) || 0)
            };

            // Only add if we have valid numeric data
            if (food.name && (food.protein > 0 || food.fat > 0 || food.carbs > 0 || food.calories > 0)) {
                foods.push(food);
            }
        }
    }

    return foods;
}

/**
 * Parse a single CSV line handling quoted fields properly
 * @param {string} line - CSV line to parse
 * @returns {Array} - Array of field values
 */
function parseCSVLine(line) {
    const fields = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                // Escaped quote
                current += '"';
                i++; // Skip next quote
            } else {
                // Toggle quote mode
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            // Field separator outside quotes
            fields.push(current);
            current = '';
        } else {
            current += char;
        }
    }

    // Add the last field
    fields.push(current);

    return fields;
}
