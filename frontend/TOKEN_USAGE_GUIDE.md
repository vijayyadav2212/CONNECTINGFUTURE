# Auth0 Token Usage Guide

## Setup Complete ✅

Your Auth0 token management system is now ready to use! Here's what has been set up:

### Files Created:
- `lib/auth/tokenManager.js` - Token storage and management
- `lib/auth/apiClient.js` - API client with automatic token handling
- `contexts/AuthTokenContext.js` - React context for token state
- `hooks/useAuth0Token.js` - Custom hook for token management
- `src/app/api/auth/token/route.js` - API endpoint to get tokens
- `components/examples/TokenUsageExample.jsx` - Usage example

### Configuration Updated:
- `frontend/.env.local` - Added AUTH0_AUDIENCE and fixed API_BASE_URL
- `backend/.env` - Added Auth0 domain and audience
- `src/app/providers.tsx` - Added AuthTokenProvider

## How to Use in Your Existing Profile Pages

### Method 1: Using the Context Hook (Recommended)
```jsx
import { useAuthToken } from '../../contexts/AuthTokenContext';
import apiClient from '../../lib/auth/apiClient';

function YourProfileComponent() {
  const { token, isAuthenticated, tokenLoading } = useAuthToken();

  const saveProfile = async (profileData) => {
    if (!isAuthenticated) return;
    
    try {
      // This automatically includes the token in headers
      const result = await apiClient.updateUserProfile(profileData);
      console.log('Profile saved:', result);
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  if (tokenLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Please log in</div>;

  return (
    <div>
      {/* Your existing profile form */}
      <button onClick={() => saveProfile(formData)}>
        Save Profile
      </button>
    </div>
  );
}
```

### Method 2: Using the API Client Directly
```jsx
import apiClient from '../../lib/auth/apiClient';

// In any component or function
const saveUserData = async (data) => {
  try {
    // These methods automatically handle authentication
    await apiClient.updateUserProfile(data);
    
    // Or store other data
    await apiClient.storeData('posts', {
      title: 'My Blog Post',
      content: 'Content here...'
    });
  } catch (error) {
    console.error('API Error:', error);
  }
};
```

### Method 3: Manual Token Usage
```jsx
import { useAuthToken } from '../../contexts/AuthTokenContext';

function ManualTokenUsage() {
  const { token } = useAuthToken();

  const makeAPICall = async () => {
    if (!token) return;

    const response = await fetch('http://localhost:4000/api/users/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    return data;
  };
}
```

## Available API Methods

The `apiClient` provides these methods:
- `apiClient.getUserProfile()` - Get current user profile
- `apiClient.updateUserProfile(data)` - Update user profile
- `apiClient.createUser(data)` - Create new user
- `apiClient.storeData(table, data)` - Store data in any table
- `apiClient.get(endpoint)` - Generic GET request
- `apiClient.post(endpoint, data)` - Generic POST request
- `apiClient.put(endpoint, data)` - Generic PUT request
- `apiClient.delete(endpoint)` - Generic DELETE request

## Token Features

✅ **Automatic Storage**: Tokens are stored in memory and localStorage
✅ **Expiration Handling**: Automatically checks token expiration
✅ **Refresh Support**: Can refresh tokens when needed
✅ **Error Handling**: Handles 401 errors and token clearing
✅ **Server-Side Support**: Works with Next.js API routes

## Testing the Setup

1. Start your backend server: `cd backend && node server.js`
2. Start your frontend: `cd frontend && npm run dev`
3. Log in through Auth0
4. Visit a page with the TokenUsageExample component to test

The token will be automatically fetched and stored when a user logs in, and all API calls through the apiClient will include the token automatically.

## Integration with Your Existing Code

You don't need to change your existing profile page logic! Just:
1. Wrap any API calls with the `apiClient` methods
2. Use the `useAuthToken` hook to check authentication status
3. The token management happens automatically in the background

Your existing profile forms and components can continue to work exactly as they do now, just swap out the API calls to use the authenticated client.
