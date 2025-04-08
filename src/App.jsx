import React, { useEffect, useState, useCallback } from "react";

const API = import.meta.env.VITE_API_URL;

const PAGE_SIZE = 15;
// Debounce delay in milliseconds
const DEBOUNCE_DELAY = 300;

export default function App() {
  const [foods, setFoods] = useState([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  // Immediate input values (what user types)
  const [searchInput, setSearchInput] = useState("");
  const [cuisineInput, setCuisineInput] = useState("");

  // Debounced values (what we use for API calls)
  const [search, setSearch] = useState("");
  const [cuisine, setCuisine] = useState("");

  const [sort, setSort] = useState("rating");
  const [leaderboard, setLeaderboard] = useState([]);
  const [ratingUpdate, setRatingUpdate] = useState({});
  const [message, setMessage] = useState("");

  // Debounce function
  const debounce = (callback, delay) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => callback(...args), delay);
    };
  };

  // Create debounced search updaters
  const debouncedSetSearch = useCallback(
    debounce((value) => setSearch(value), DEBOUNCE_DELAY),
    []
  );

  const debouncedSetCuisine = useCallback(
    debounce((value) => setCuisine(value), DEBOUNCE_DELAY),
    []
  );

  // Fetch a page; if `append` we merge with existing list
  const fetchFoods = async (append = false) => {
    const params = new URLSearchParams();
    if (cuisine) params.append("cuisine", cuisine);
    if (search) params.append("search", search);
    if (sort) params.append("sort", sort);
    params.append("offset", append ? offset : 0);
    params.append("limit", PAGE_SIZE);

    try {
      const res = await fetch(`${API}/api/foods?${params}`);
      const data = await res.json();

      setFoods((prev) => (append ? [...prev, ...data] : data));
      setHasMore(data.length === PAGE_SIZE);
      setOffset((prev) => (append ? prev + data.length : data.length));
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch(`${API}/api/foods/leaderboard`);
      setLeaderboard(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  // Initial load
  useEffect(() => {
    fetchFoods(false);
    fetchLeaderboard();
  }, []);

  // Reset paging when filters change
  useEffect(() => {
    setOffset(0);
    fetchFoods(false);
  }, [search, cuisine, sort]);

  const updateRating = async (name, rating) => {
    try {
      const res = await fetch(
        `${API}/api/foods/update-rating?` +
          `name=${encodeURIComponent(name)}&rating=${encodeURIComponent(
            rating
          )}`,
        { method: "POST" }
      );
      setMessage(await res.text());
      // reload first page & leaderboard
      setOffset(0);
      fetchFoods(false);
      fetchLeaderboard();
    } catch (e) {
      console.error(e);
    }
  };

  const handleRatingChange = (name, val) => {
    setRatingUpdate((prev) => ({ ...prev, [name]: val }));
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    debouncedSetSearch(value);
  };

  const handleCuisineChange = (e) => {
    const value = e.target.value;
    setCuisineInput(value);
    debouncedSetCuisine(value);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-8 text-center">
          <h1 className="text-5xl font-bold drop-shadow-md">Flavor Explorer</h1>
        </header>

        {/* Dismissible Message */}
        {message && (
          <div className="relative mb-6 inline-block bg-gray-800 px-6 py-3 rounded-lg shadow-lg">
            <span>{message}</span>
            <button
              onClick={() => setMessage("")}
              className="absolute top-1 right-2 text-gray-400 hover:text-gray-200"
            >
              &times;
            </button>
          </div>
        )}

        {/* Leaderboard */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold mb-6">Top 5 Foods Overall</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-6">
            {leaderboard.map((food, i) => (
              <div
                key={i}
                className="bg-gray-800 rounded-xl p-6 flex flex-col items-center shadow-lg transform transition-transform duration-300 hover:scale-105 hover:shadow-2xl"
              >
                <span className="text-2xl font-bold">#{i + 1}</span>
                <img
                  src={food.imageUrl}
                  alt={food.name}
                  className="w-32 h-32 object-cover rounded-full my-4 ring-2 ring-gray-700"
                />
                <div className="text-xl font-medium">{food.name}</div>
                <div className="text-sm uppercase tracking-wide text-gray-400">
                  {food.cuisine}
                </div>
                <div className="mt-2 text-lg text-gray-200">
                  ⭐ {food.rating.toFixed(1)}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Search & Filter */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold mb-6">Search & Filter</h2>
          <div className="flex flex-wrap gap-4">
            <div>
              <input
                type="text"
                className="w-64 p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-600"
                placeholder="Search by Name"
                value={searchInput}
                onChange={handleSearchChange}
              />
              <div className="text-xs text-gray-400 mt-1 ml-2">
                Searches for text in food names
              </div>
            </div>

            <div>
              <input
                type="text"
                className="w-64 p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-600"
                placeholder="Filter by Cuisine"
                value={cuisineInput}
                onChange={handleCuisineChange}
              />
              <div className="text-xs text-gray-400 mt-1 ml-2">
                Enter cuisine prefix (e.g., "I" for Indian, Italian)
              </div>
            </div>

            <div>
              <select
                className="w-48 p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-600"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option value="rating">Rating (High → Low)</option>
                <option value="price">Price (Low → High)</option>
              </select>
              <div className="text-xs text-gray-400 mt-1 ml-2">
                Choose how results are ordered
              </div>
            </div>
          </div>
        </section>

        {/* Foods Table */}
        <section className="mb-16">
          <h2 className="text-3xl font-semibold mb-6">Foods</h2>
          {foods.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full table-auto bg-gray-800 rounded-lg overflow-hidden shadow-lg text-center">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Cuisine</th>
                    <th className="px-4 py-3">Rating</th>
                    <th className="px-4 py-3">Price</th>
                    <th className="px-4 py-3">Image</th>
                    <th className="px-4 py-3">Update</th>
                  </tr>
                </thead>
                <tbody>
                  {foods.map((food, i) => (
                    <tr
                      key={i}
                      className={`border-b border-gray-700 ${
                        i % 2 === 0 ? "bg-gray-800" : "bg-gray-900"
                      } hover:bg-gray-700 transition-colors duration-200`}
                    >
                      <td className="px-4 py-3">{i + 1}</td>
                      <td className="px-4 py-3">{food.name}</td>
                      <td className="px-4 py-3">{food.cuisine}</td>
                      <td className="px-4 py-3">{food.rating.toFixed(1)}</td>
                      <td className="px-4 py-3">${food.price.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <img
                          src={food.imageUrl}
                          alt={food.name}
                          className="w-12 h-12 object-cover rounded-full mx-auto ring-2 ring-gray-700"
                        />
                      </td>
                      <td className="px-4 py-3 flex justify-center items-center space-x-2">
                        <input
                          type="number"
                          className="w-20 p-1 bg-gray-800 border border-gray-700 rounded text-center focus:outline-none focus:ring-2 focus:ring-gray-600"
                          step="0.1"
                          min="0"
                          max="10"
                          value={ratingUpdate[food.name] ?? food.rating}
                          onChange={(e) =>
                            handleRatingChange(
                              food.name,
                              parseFloat(e.target.value)
                            )
                          }
                        />
                        <button
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded-lg shadow-md"
                          onClick={() =>
                            updateRating(
                              food.name,
                              ratingUpdate[food.name] ?? food.rating
                            )
                          }
                        >
                          Update
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-800 rounded-lg">
              <p className="text-xl text-gray-400">
                No foods match your current filters
              </p>
            </div>
          )}

          {/* Load More */}
          {hasMore && (
            <div className="text-center mt-6">
              <button
                onClick={() => fetchFoods(true)}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg shadow-md"
              >
                Load More
              </button>
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="text-center text-gray-500 text-sm">
          © 2025 Vikash Mall. All rights reserved.
          <br />
          Data provided by TheMealDB.
        </footer>
      </div>
    </div>
  );
}
