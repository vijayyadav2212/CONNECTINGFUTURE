export default function StudentProfile() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Student Profile</h1>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="Enter your name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Student ID</label>
                <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="Enter student ID" />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Course</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option>Select your course</option>
                  <option>Computer Science</option>
                  <option>Information Technology</option>
                  <option>Electronics</option>
                  <option>Mechanical</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option>Select year</option>
                  <option>1st Year</option>
                  <option>2nd Year</option>
                  <option>3rd Year</option>
                  <option>4th Year</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">About</label>
              <textarea rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="Tell us about yourself..."></textarea>
            </div>
            
            <button className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700">
              Save Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
