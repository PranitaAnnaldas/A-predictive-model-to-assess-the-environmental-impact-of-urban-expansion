// Function to handle rendering of Pie Chart
function renderPieChart(ctx, chartData) {
    if (!chartData || !chartData.datasets || chartData.datasets[0].data.every(val => val === 0)) {
        alert("No data available for this chart.");
        return;
    }
    new Chart(ctx, {
        type: 'pie',
        data: chartData
    });
}

// Function to handle rendering of Line Chart
function renderLineChart(ctx, chartData) {
    if (!chartData || !chartData.datasets || chartData.datasets[0].data.every(val => val === 0)) {
        alert("No data available for this chart.");
        return;
    }
    new Chart(ctx, {
        type: 'line',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    beginAtZero: true
                },
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

document.getElementById('search-button').addEventListener('click', function() {
    const wardNo = document.getElementById('populationSearchByWardChart').value;
    const year = document.getElementById('yearDropdown').value;  // Fetch year from dropdown

    if (!wardNo){
        wardNo = 1
    }
    if (!year){
        year = 1991
    }

    if (!wardNo || !year) {
        alert('Please enter both Ward number and select a Year.');
        return;
    }

    fetch(`/api/population-search?wardno=${wardNo}&year=${year}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('No data found for the selected ward and year');
            }
            return response.json();
        })
        .then(data => {
            // Assuming the first item in the array is the required result
            const result = data[0];
            document.getElementById('total-pop').textContent = result.totalpop || 'N/A';
            document.getElementById('total-female').textContent = result.totalfemale || 'N/A';
            document.getElementById('total-male').textContent = result.totalmale || 'N/A';
            document.getElementById('total-caste').textContent = result.totalcaste || 'N/A';
            document.getElementById('total-tribes').textContent = result.totaltribes || 'N/A';
            document.getElementById('total-literate').textContent = result.totalliterates || 'N/A';
            document.getElementById('total-illiterate').textContent = result.totalilliterates || 'N/A';
        })
        .catch(error => {
            console.error('Error:', error);
            alert('No data found or an error occurred while fetching the data.');
        });
});

// Fetch Gender Comparison Data
function fetchGenderComparison(year, comparisonType) {
    fetch(`/api/gender-comparison?year=${year}&type=${comparisonType}`)
        .then(response => response.json())
        .then(data => {
            if (!data || data.message) {
                console.error("Error fetching gender comparison data: ", data ? data.message : 'No data returned');
                return;
            }

            let male, female;
            if (comparisonType === 'population') {
                male = data.total_male;
                female = data.total_female;
            } else if (comparisonType === 'literacy') {
                male = data.literate_male;
                female = data.literate_female;
            } else if (comparisonType === 'illiteracy') {
                male = data.illiterate_male;
                female = data.illiterate_female;
            }

            const chartData = {
                labels: ['Male', 'Female'],
                datasets: [{
                    data: [male, female],
                    backgroundColor: ['rgba(54, 162, 235, 0.5)', 'rgba(75, 192, 192, 0.5)']
                }]
            };

            const ctx = document.getElementById('genderComparisonChart').getContext('2d');
            renderPieChart(ctx, chartData);
        })
        .catch(error => console.error("Error fetching gender comparison data: ", error));
}
document.addEventListener('DOMContentLoaded', function () {
    // Add event listeners to each dropdown item
    document.getElementById('population-analysis').addEventListener('click', function () {
        handleAnalysisSelection('population');
    });
    document.getElementById('literacy-analysis').addEventListener('click', function () {
        handleAnalysisSelection('literacy');
    });
    document.getElementById('illiteracy-analysis').addEventListener('click', function () {
        handleAnalysisSelection('illiteracy');
    });
    document.getElementById('tribes-analysis').addEventListener('click', function () {
        handleAnalysisSelection('tribes');
    });
    document.getElementById('castes-analysis').addEventListener('click', function () {
        handleAnalysisSelection('castes');
    });
});

// Function to handle the analysis selection and fetch data
function handleAnalysisSelection(comparisonType) {
    const year = document.getElementById('yearDropdown').value;  // Assuming this element holds the selected year

    if (!year) {
        alert('Please select a year.');
        return;
    }

    // Call the function to fetch and render gender comparison data
    fetchGenderComparison(year, comparisonType);
}

// Fetch Population Trends Data and Display as Line Chart
function fetchPopulationTrends() {
    fetch('/api/population-trends')
        .then(response => response.json())
        .then(data => {
            if (!data || data.length === 0) {
                console.error("No population trends data available.");
                return;
            }

            // Extract years and total_population for chart data
            const years = data.map(item => item.year);
            const population = data.map(item => item.total_population);

            // Prepare data for the line chart
            const chartData = {
                labels: years,  // X-axis labels (years)
                datasets: [{
                    label: 'Population Growth Over Time',
                    data: population,  // Y-axis data (total population)
                    borderColor: '#BF2818',  // Line color
                    fill: false,  // Don't fill the area under the line
                    borderWidth: 2
                }]
            };

            // Get the canvas context for the Population Trends Chart
            const ctx = document.getElementById('populationTrendsOverTimeChart').getContext('2d');

            // Render the line chart
            new Chart(ctx, {
                type: 'line',  // Change chart type to line
                data: chartData,
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: false,  // Population can't be zero, so don't start from zero
                            ticks: {
                                stepSize: 1000000,  // Adjust the step size for y-axis labels
                                callback: function(value) {
                                    return value.toLocaleString();  // Format population with commas
                                }
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Year'  // X-axis label
                            }
                        }
                    },
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function(tooltipItem) {
                                    return tooltipItem.raw.toLocaleString();  // Format tooltip value with commas
                                }
                            }
                        }
                    }
                }
            });
        })
        .catch(error => console.error("Error fetching population trends data: ", error));
}

// Fetch Caste and Tribe Analysis Data and Display as Bar Chart
function fetchCasteTribeAnalysis(year) {
    fetch(`/api/caste-tribe-analysis?year=${year}`)
        .then(response => response.json())
        .then(data => {
            if (!data || data.length === 0) {
                console.error("No caste/tribe analysis data available.");
                return;
            }

            // Extracting the data from the response (since it's an array with one object)
            const yearData = data[0];
            const totalCaste = yearData.total_caste;
            const totalTribe = yearData.total_tribe;

            // Prepare data for the bar chart
            const chartData = {
                labels: ['Caste Population', 'Tribe Population'],  // Categories for the bars
                datasets: [{
                    label: 'Population Distribution',
                    data: [totalCaste, totalTribe],  // Values for each category
                    backgroundColor: ['rgba(54, 162, 235, 0.1)', 'rgba(153, 102, 255, 0.1)'],  // Colors for the bars
                    borderColor: ['rgba(54, 162, 235, 1)', 'rgba(153, 102, 255, 1)'],  // Border colors for the bars
                    borderWidth: 1
                }]
            };

            // Get the canvas context for the Caste and Tribe Analysis Chart
            const ctx = document.getElementById('casteTribesAnalysisChart').getContext('2d');

            // Render the bar chart
            new Chart(ctx, {
                type: 'bar',  // Change chart type to bar
                data: chartData,
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true,  // Ensure the y-axis starts at 0
                            ticks: {
                                stepSize: 1000000  // Adjust the step size for the y-axis as needed
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Population Categories'  // X-axis label
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            display: false  // Hide the legend, as there's only one dataset
                        },
                        tooltip: {
                            callbacks: {
                                label: function(tooltipItem) {
                                    return tooltipItem.raw.toLocaleString();  // Display the raw value with commas
                                }
                            }
                        }
                    }
                }
            });
        })
        .catch(error => console.error("Error fetching caste/tribe analysis data: ", error));
}

// Function to render a bar chart (Literacy or Illiteracy)
function renderBarChart(ctx, chartData) {
    if (!chartData || !chartData.datasets || chartData.datasets[0].data.every(val => val === 0)) {
        alert("No data available for this chart.");
        return;
    }

    new Chart(ctx, {
        type: 'bar',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    beginAtZero: true
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        beginAtZero: true,
                        stepSize: 1000  // Adjust stepSize as needed based on your data
                    }
                }
            }
        }
    });
}

// Fetch Literacy Data for Male and Female
function fetchLiteracyAnalysis(year) {
    fetch(`/api/literacy-analysis?year=${year}`)
        .then(response => response.json())
        .then(data => {
            if (!data || !data[0]) {
                console.error("No literacy analysis data available.");
                return;
            }

            // Extract male and female literacy rates from the data
            const maleLiteracy = data[0].male_literates || 0;
            const femaleLiteracy = data[0].female_literates || 0;

            const chartData = {
                labels: ['Male', 'Female'],
                datasets: [{
                    label: 'Literacy ',
                    data: [maleLiteracy, femaleLiteracy],
                    backgroundColor: ['rgba(75, 192, 192, 0.2)', 'rgba(255, 99, 132, 0.2)'],
                    borderColor: ['rgba(75, 192, 192, 1)', 'rgba(255, 99, 132, 1)'],
                    borderWidth: 1
                }]
            };

            const ctx = document.getElementById('literacyAnalysisChart').getContext('2d');
            renderBarChart(ctx, chartData);
        })
        .catch(error => console.error("Error fetching literacy analysis data: ", error));
}

// Fetch Illiteracy Data for Male and Female
function fetchIlliteracyAnalysis(year) {
    fetch(`/api/illiteracy-analysis?year=${year}`)
        .then(response => response.json())
        .then(data => {
            if (!data || !data[0]) {
                console.error("No illiteracy analysis data available.");
                return;
            }

            // Extract male and female illiteracy rates from the data
            const maleIlliteracy = data[0].male_illiterates || 0;
            const femaleIlliteracy = data[0].female_illiterates || 0;

            const chartData = {
                labels: ['Male', 'Female'],
                datasets: [{
                    label: 'Illiteracy ',
                    data: [maleIlliteracy, femaleIlliteracy],
                    backgroundColor: ['rgb(155, 255, 86, 0.2)', 'rgb(255, 104, 71, 0.2)'],
                    borderColor: ['rgb(155, 255, 86, 1)', 'rgb(255, 104, 71, 1)'],
                    borderWidth: 1
                }]
            };

            const ctx = document.getElementById('illiteracyAnalysisChart').getContext('2d');
            renderBarChart(ctx, chartData);
        })
        .catch(error => console.error("Error fetching illiteracy analysis data: ", error));
}

// Fetch Ward-wise Analysis Data and Display as Scatter Plot
function fetchWardAnalysis(year) {
    fetch(`/api/ward-analysis?year=${year}`)
        .then(response => response.json())
        .then(data => {
            if (!data || data.length === 0) {
                console.error("No ward-wise analysis data available.");
                return;
            }

            // Extract ward numbers, total population, caste, and tribes data
            const wards = data.map(item => item.wardno);
            const totalPop = data.map(item => item.totalpop);
            const totalCaste = data.map(item => item.totalcaste);
            const totalTribes = data.map(item => item.totaltribes);

            // Prepare data for the scatter plot
            const chartData = {
                datasets: [{
                    label: 'Total Population',
                    data: wards.map((ward, index) => ({ x: ward, y: totalPop[index] })),
                    backgroundColor: '#FF6384',
                    pointRadius: 5
                }, {
                    label: 'Total Caste',
                    data: wards.map((ward, index) => ({ x: ward, y: totalCaste[index] })),
                    backgroundColor: '#36A2EB',
                    pointRadius: 5
                }, {
                    label: 'Total Tribes',
                    data: wards.map((ward, index) => ({ x: ward, y: totalTribes[index] })),
                    backgroundColor: '#4BC0C0',
                    pointRadius: 5
                }]
            };

            // Get the canvas context for the Ward Analysis Scatter Plot
            const ctx = document.getElementById('wardWiseAnalysisChart').getContext('2d');

            // Render the scatter plot
            new Chart(ctx, {
                type: 'scatter',  // Scatter plot
                data: chartData,
                options: {
                    responsive: true,
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: 'Ward Number'  // X-axis label
                            },
                            ticks: {
                                stepSize: 1  // Set the step size for ward numbers
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: 'Population / Caste / Tribes'  // Y-axis label
                            },
                            ticks: {
                                beginAtZero: true,
                                callback: function(value) {
                                    return value.toLocaleString();  // Format y-axis values with commas
                                }
                            }
                        }
                    },
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function(tooltipItem) {
                                    return tooltipItem.raw.y.toLocaleString();  // Format tooltip value with commas
                                }
                            }
                        }
                    }
                }
            });
        })
        .catch(error => console.error("Error fetching ward analysis data: ", error));
}
document.addEventListener("DOMContentLoaded", function () {
    // Call the function to fetch data with the default year
    fetchPopulationTrends();
    fetchGenderComparison(1991, 'population');
    fetchLiteracyAnalysis(1991);
    fetchIlliteracyAnalysis(1991);
    fetchCasteTribeAnalysis(1991);
    fetchWardAnalysis(1991);
});

// Event listener for year selection
document.getElementById('yearDropdown').addEventListener('change', function() {
    const selectedYear = this.value;
    if (!selectedYear){
        selectedYear = 1991
    }
    // Update the charts with the selected year
    fetchPopulationTrends(selectedYear);
    fetchGenderComparison(selectedYear, 'population');
    fetchLiteracyAnalysis(selectedYear);
    fetchIlliteracyAnalysis(selectedYear);
    fetchCasteTribeAnalysis(selectedYear);
    fetchWardAnalysis(selectedYear);
});
