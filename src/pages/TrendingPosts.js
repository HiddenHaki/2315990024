import { useState, useEffect } from 'react';
import { FireIcon, ChartBarIcon, ClockIcon } from '@heroicons/react/24/outline';
import { fetchUsers, fetchUserPosts, fetchPostComments } from '../services/api';

export default function TrendingPosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const loadTrendingPosts = async () => {
    try {
      setLoading(true);
      // Fetch all users
      const users = await fetchUsers();
      
      if (users.length === 0) {
        setError('No users found');
        setLoading(false);
        return;
      }

      // Fetch all posts with user information
      const allPosts = await Promise.all(
        users.map(async (user) => {
          const userPosts = await fetchUserPosts(user.id);
          return userPosts.map(post => ({
            ...post,
            author: user.name || 'Anonymous',
            authorUsername: user.username || 'anonymous'
          }));
        })
      );

      // Flatten posts array and filter out invalid posts
      let flattenedPosts = allPosts
        .flat()
        .filter(post => post.content && post.id); // Ensure posts have content and ID

      if (flattenedPosts.length === 0) {
        setError('No posts available');
        setLoading(false);
        return;
      }

      // Fetch comments for each post
      const postsWithEngagement = await Promise.all(
        flattenedPosts.map(async (post) => {
          const comments = await fetchPostComments(post.id);
          const totalEngagement = (post.likes || 0) + comments.length;
          const engagementRate = (totalEngagement / (post.views || 1) * 100).toFixed(1);
          
          // Calculate growth (comparing to previous period)
          const previousPeriodEngagement = post.previousLikes || 0;
          const growth = previousPeriodEngagement > 0
            ? ((totalEngagement - previousPeriodEngagement) / previousPeriodEngagement * 100).toFixed(0)
            : '100';

          return {
            ...post,
            comments: comments.length,
            engagement: totalEngagement,
            engagementRate: `${engagementRate}%`,
            growth: `+${growth}%`,
            category: post.category || 'General'
          };
        })
      );

      // Sort by engagement and take top posts
      const trendingPosts = postsWithEngagement
        .sort((a, b) => b.engagement - a.engagement)
        .slice(0, 5);

      if (trendingPosts.length > 0) {
        setPosts(trendingPosts);
        setLastUpdated(new Date());
        setError(null);
      } else {
        setError('No trending posts available');
      }
    } catch (err) {
      setError('Unable to load trending posts. Please try again later.');
      console.error('Error loading trending posts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrendingPosts();
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
            onClick={loadTrendingPosts}
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
        <h2 className="text-2xl font-bold text-gray-900">Trending Posts</h2>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <ClockIcon className="h-5 w-5" />
          <span>Updated {new Date(lastUpdated).toLocaleTimeString()}</span>
        </div>
      </div>

      <div className="grid gap-6">
        {posts.map((post) => (
          <div key={post.id} className="stats-card">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                    {post.category}
                  </span>
                  <span className="text-sm text-gray-500">
                    {new Date(post.timestamp).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-900 font-medium mb-2">{post.content}</p>
                <p className="text-sm text-gray-500">Posted by {post.author}</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <FireIcon className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-sm text-gray-500">Engagement</p>
                  <p className="font-semibold">{post.engagementRate}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <ChartBarIcon className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-gray-500">Growth</p>
                  <p className="font-semibold text-green-600">{post.growth}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 