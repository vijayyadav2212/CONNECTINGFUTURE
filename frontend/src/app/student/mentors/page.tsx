export default function FindMentors() {
  const mentors = [
    { name: "Priya Sharma", company: "Google", expertise: "Frontend Development", experience: "5+ years" },
    { name: "Rahul Kumar", company: "Microsoft", expertise: "Backend Development", experience: "7+ years" },
    { name: "Sneha Patel", company: "Amazon", expertise: "Data Science", experience: "4+ years" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Find Mentors</h1>
          
          <div className="mb-6">
            <div className="flex gap-4">
              <input 
                type="text" 
                placeholder="Search by expertise..." 
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md"
              />
              <select className="px-4 py-2 border border-gray-300 rounded-md">
                <option>All Companies</option>
                <option>Google</option>
                <option>Microsoft</option>
                <option>Amazon</option>
              </select>
              <button className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700">
                Search
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mentors.map((mentor, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold">{mentor.name.charAt(0)}</span>
                  </div>
                  <div className="ml-4">
                    <h3 className="font-semibold text-gray-900">{mentor.name}</h3>
                    <p className="text-sm text-gray-600">{mentor.company}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm"><span className="font-medium">Expertise:</span> {mentor.expertise}</p>
                  <p className="text-sm"><span className="font-medium">Experience:</span> {mentor.experience}</p>
                </div>
                <button className="w-full mt-4 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700">
                  Request Mentorship
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
