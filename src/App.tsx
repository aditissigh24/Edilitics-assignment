
import CovidChart from './components/CovidChart';
import { sampleCovidData } from './data/sampleData';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-6 lg:p-8 transition-colors duration-300">
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Section */}
      <header className="text-center mb-8 space-y-2">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
          COVID-19 Global Statistics
        </h1>
        <p className="text-gray-600 dark:text-gray-300 text-lg">
          Interactive visualization of global pandemic data
        </p>
      </header>

      {/* Main Chart Container */}
      <div className="bg-white dark:bg-gray-800  rounded-2xl shadow-xl overflow-hidden backdrop-blur-sm backdrop-filter border border-gray-100 dark:border-gray-700">
        <div className="p-4 sm:p-6">
          <CovidChart data={sampleCovidData} />
        </div>
      </div>

      {/* Footer Attribution */}
      <footer className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8">
        <p>Data visualization powered by D3.js</p>
      </footer>
    </div>
  </div>
  );
}

export default App;