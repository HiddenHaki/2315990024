import { useState, useEffect } from 'react';
import { UserCircleIcon, ArrowTrendingUpIcon, HashtagIcon } from '@heroicons/react/24/outline';
import { fetchUsers, fetchUserPosts } from '../services/api';

export default function TopUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        const usersData = await fetchUsers();
        
        if (usersData.length === 0) {
          setError('No users found');
          return;
        }

        // Fetch posts for each user to calculate engagement
        const usersWithStats = await Promise.all(
          usersData.map(async (user) => {
            const posts = await fetchUserPosts(user.id);
            const totalEngagement = posts.reduce((sum, post) => sum + (post.likes + post.comments), 0);
            const engagementRate = ((totalEngagement / (user.followers || 1)) * 100).toFixed(1);
            
            return {
              ...user,
              postsCount: posts.length,
              engagement: `${engagementRate}%`,
              topHashtags: posts
                .flatMap(post => post.hashtags || [])
                .slice(0, 3)
            };
          })
        );

        // Sort users by engagement rate
        const sortedUsers = usersWithStats.sort((a, b) => 
          parseFloat(b.engagement) - parseFloat(a.engagement)
        );

        if (sortedUsers.length > 0) {
          setUsers(sortedUsers);
          setError(null);
        } else {
          setError('No user data available');
        }
      } catch (err) {
        setError('Unable to load users data. Please try again later.');
        console.error('Error loading users:', err);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  if (loading) {
    return (
      <div className="page-container">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="text-center text-red-600">
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Top Performing Users</h2>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {users.map((user) => (
          <div key={user.id} className="stats-card">
            <div className="flex items-center space-x-3 mb-4">
              {user.profilePicture ? (
                <img 
                  src={user.profilePicture} 
                  alt={user.name} 
                  className="h-10 w-10 rounded-full"
                />
              ) : (
                <UserCircleIcon className="h-10 w-10 text-gray-400" />
              )}
              <div>
                <h3 className="font-semibold text-gray-900">{user.name}</h3>
                <p className="text-sm text-gray-500">@{user.username}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Followers</p>
                <p className="text-lg font-semibold text-gray-900">
                  {user.followers?.toLocaleString() || '0'}
                </p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Engagement</p>
                <div className="flex items-center justify-center">
                  <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                  <p className="text-lg font-semibold text-gray-900">{user.engagement}</p>
                </div>
              </div>
            </div>
            
            {user.topHashtags?.length > 0 && (
              <div>
                <p className="text-sm text-gray-500 mb-2">Top Hashtags</p>
                <div className="flex flex-wrap gap-2">
                  {user.topHashtags.map((tag, index) => (
                    <span 
                      key={index} 
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                    >
                      <HashtagIcon className="h-3 w-3 mr-1" />
                      {tag.replace('#', '')}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 