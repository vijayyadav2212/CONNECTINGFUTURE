export default function StudentDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Student Dashboard</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h2 className="text-lg font-semibold text-blue-900 mb-2">Find Mentors</h2>
              <p className="text-blue-700">Connect with alumni for career guidance</p>
            </div>
            
            <div className="bg-green-50 p-6 rounded-lg">
              <h2 className="text-lg font-semibold text-green-900 mb-2">Job Search</h2>
              <p className="text-green-700">Browse job opportunities posted by alumni</p>
            </div>
            
            <div className="bg-purple-50 p-6 rounded-lg">
              <h2 className="text-lg font-semibold text-purple-900 mb-2">Learning Roadmaps</h2>
              <p className="text-purple-700">Follow career roadmaps created by alumni</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
