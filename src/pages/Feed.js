import { useState, useEffect } from 'react';
import { HeartIcon, ChatBubbleLeftIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { fetchUsers, fetchUserPosts, fetchPostComments } from '../services/api';

export default function Feed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadFeed = async () => {
    try {
      setLoading(true);
      // First fetch all users
      const users = await fetchUsers();
      
      if (users.length === 0) {
        setError('No users found');
        setLoading(false);
        return;
      }

      // Then fetch posts for each user
      const allPosts = await Promise.all(
        users.map(async (user) => {
          const userPosts = await fetchUserPosts(user.id);
          return userPosts.map(post => ({
            ...post,
            author: user.name || 'Anonymous',
            authorUsername: user.username || 'anonymous',
            authorAvatar: user.profilePicture
          }));
        })
      );

      // Flatten and sort posts by timestamp
      const flattenedPosts = allPosts
        .flat()
        .filter(post => post.content) // Filter out posts without content
        .sort((a, b) => new Date(b.timestamp || Date.now()) - new Date(a.timestamp || Date.now()));

      if (flattenedPosts.length === 0) {
        setError('No posts available');
        setLoading(false);
        return;
      }

      // Fetch comments for each post
      const postsWithComments = await Promise.all(
        flattenedPosts.map(async (post) => {
          const comments = await fetchPostComments(post.id);
          return {
            ...post,
            comments: comments.length,
            engagement: ((post.likes + comments.length) / (post.views || 1) * 100).toFixed(1) + '%'
          };
        })
      );

      setPosts(postsWithComments);
      setError(null);
    } catch (err) {
      setError('Unable to load feed. Please try again later.');
      console.error('Error loading feed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeed();
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
            onClick={loadFeed}
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
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Social Feed</h2>
        <button 
          onClick={loadFeed}
          className="flex items-center px-4 py-2 text-sm text-primary hover:bg-primary/5 rounded-md"
        >
          <ArrowPathIcon className="h-5 w-5 mr-2" />
          Refresh Feed
        </button>
      </div>
      
      <div className="grid gap-6">
        {posts.map((post) => (
          <div key={post.id} className="card">
            <div className="flex items-start justify-between">
              <div className="flex items-center">
                {post.authorAvatar ? (
                  <img 
                    src={post.authorAvatar} 
                    alt={post.author}
                    className="h-10 w-10 rounded-full mr-3"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-gray-200 mr-3" />
                )}
                <div>
                  <h3 className="font-semibold text-gray-900">{post.author}</h3>
                  <p className="text-sm text-gray-500">
                    @{post.authorUsername} · {new Date(post.timestamp).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="text-sm text-primary font-medium">
                {post.engagement} Engagement
              </div>
            </div>
            
            <p className="mt-3 text-gray-700">{post.content}</p>
            
            <div className="mt-4 flex items-center space-x-6">
              <div className="flex items-center text-gray-500">
                <HeartIcon className="h-5 w-5 mr-1" />
                <span className="text-sm">{post.likes?.toLocaleString() || 0}</span>
              </div>
              <div className="flex items-center text-gray-500">
                <ChatBubbleLeftIcon className="h-5 w-5 mr-1" />
                <span className="text-sm">{post.comments?.toLocaleString() || 0}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 