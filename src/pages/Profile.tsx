import { getAuth, signOut } from "firebase/auth";

export default function Profile() {
  const auth = getAuth();
  const user = auth.currentUser;

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="text-center">
          {user?.photoURL && (
            <img 
              src={user.photoURL} 
              alt="Profile" 
              className="w-24 h-24 rounded-full mx-auto mb-4"
            />
          )}
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {user?.displayName}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {user?.email}
          </p>
        </div>
        
        <div className="mt-6">
          <button
            onClick={handleSignOut}
            className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
} 