/**
 * Simple Socket.IO Client Test Script
 *
 * Usage: node test-socket.js
 *
 * Make sure to:
 * 1. Install socket.io-client: npm install socket.io-client
 * 2. Update the URL, userId, and chatId below
 * 3. Ensure WS_SERVER_ENABLE=true in your .env
 */

const io = require('socket.io-client');

// Configuration - UPDATE THESE VALUES
const SOCKET_URL = 'http://localhost:5002'; // Your socket port (check your .env SOCKET_PORT)
const USER_ID = '6866cd646d0343e7125dcfbc'; // Replace with actual user ID (get from /users/me or login response)
const CHAT_ID = '686d98e8922ccb4abff41d34'; // Replace with actual chat ID (get from /chat/huddle?type=private)

// Connection timeout (10 seconds)
const CONNECTION_TIMEOUT = 10000;
let connectionTimeout;
let isConnected = false;

console.log('🚀 Starting socket connection test...');
console.log(`📍 Attempting to connect to: ${SOCKET_URL}\n`);

// Connect to socket server
const socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'], // Try both transports
    reconnection: true,
    reconnectionAttempts: 3,
    reconnectionDelay: 1000,
    timeout: CONNECTION_TIMEOUT,
});

// Set connection timeout
connectionTimeout = setTimeout(() => {
    if (!isConnected) {
        console.error('❌ Connection timeout!');
        console.log('\n💡 Troubleshooting:');
        console.log('   1. Check if WS_SERVER_ENABLE=true in your .env');
        console.log('   2. Verify server is running: npm start or node src/index.js');
        console.log('   3. Check socket port in .env (default: 5002)');
        console.log('   4. Check server logs for socket initialization');
        console.log('   5. Try: curl http://localhost:5002/socket.io/');
        socket.close();
        process.exit(1);
    }
}, CONNECTION_TIMEOUT);

// Connection events
socket.on('connect', () => {
    clearTimeout(connectionTimeout);
    isConnected = true;
    console.log('✅ SUCCESS: Connected to socket server!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   Socket ID: ${socket.id}`);
    console.log(`   Transport: ${socket.io.engine.transport.name}`);
    console.log(`   URL: ${SOCKET_URL}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Test: Join a chat
    console.log('📤 Testing: Joining chat...');
    socket.emit('join', { userId: USER_ID, chatId: CHAT_ID });

    // Test: Mark user as active
    console.log('📤 Testing: Marking user as active...');
    socket.emit('active', USER_ID);

    // Test: Check chat status
    console.log('📤 Testing: Checking chat status...');
    socket.emit('checkStatus', CHAT_ID);

    // Wait a bit, then send a test message
    setTimeout(() => {
        console.log('\n📤 Testing: Sending test private message...');
        socket.emit('privateMessage', {
            chatId: CHAT_ID,
            message: 'Test message from socket client',
            senderId: USER_ID,
            content_type: 'text',
            isBot: false,
        });
    }, 2000);
});

socket.on('connect_error', (error) => {
    clearTimeout(connectionTimeout);
    console.error('\n❌ CONNECTION FAILED!');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error(`   Error: ${error.message}`);
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('💡 Troubleshooting steps:');
    console.log('   1. ✅ Check WS_SERVER_ENABLE=true in your .env file');
    console.log('   2. ✅ Verify server is running (check terminal/console)');
    console.log('   3. ✅ Check socket port matches (default: 5002)');
    console.log('   4. ✅ Look for "WebSocket server listening on port" in server logs');
    console.log('   5. ✅ Test server reachability:');
    console.log(`      curl http://localhost:5002/socket.io/`);
    console.log('   6. ✅ Check firewall/network settings');
    console.log('   7. ✅ Verify MongoDB connection (socket server needs DB)');
    console.log('\n');
});

socket.on('disconnect', (reason) => {
    isConnected = false;
    console.log('\n🔌 Disconnected from server');
    console.log(`   Reason: ${reason}`);
    if (reason === 'io server disconnect') {
        console.log('   (Server forcefully disconnected the client)');
    } else if (reason === 'io client disconnect') {
        console.log('   (Client manually disconnected)');
    } else if (reason === 'ping timeout') {
        console.log('   (Server did not respond to ping)');
    } else if (reason === 'transport close') {
        console.log('   (Connection closed by transport)');
    } else if (reason === 'transport error') {
        console.log('   (Transport error occurred)');
    }
});

socket.on('reconnect', (attemptNumber) => {
    console.log(`🔄 Reconnected after ${attemptNumber} attempt(s)`);
});

socket.on('reconnect_attempt', (attemptNumber) => {
    console.log(`🔄 Reconnection attempt ${attemptNumber}...`);
});

socket.on('reconnect_error', (error) => {
    console.error(`❌ Reconnection error: ${error.message}`);
});

socket.on('reconnect_failed', () => {
    console.error('❌ Reconnection failed after all attempts');
});

// Listen for events
socket.on('userList', (users) => {
    console.log('📥 Received userList:', users);
});

socket.on('activeUsers', (users) => {
    console.log('📥 Received activeUsers:', users.length, 'users');
});

socket.on('privateMessage', (data) => {
    console.log('📥 Received privateMessage:', data);
});

socket.on('groupMessage', (data) => {
    console.log('📥 Received groupMessage:', data);
});

socket.on('checkStatus', (data) => {
    console.log('📥 Received checkStatus:', data);
});

socket.on('typing', (data) => {
    console.log('📥 Received typing:', data);
});

socket.on('stopTyping', (data) => {
    console.log('📥 Received stopTyping:', data);
});

// Handle errors
socket.on('error', (error) => {
    console.error('❌ Socket error:', error);
});

// Connection status helper
const checkConnectionStatus = () => {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Connection Status:');
    console.log(`   Connected: ${socket.connected ? '✅ YES' : '❌ NO'}`);
    console.log(`   Socket ID: ${socket.id || 'N/A'}`);
    console.log(`   Transport: ${socket.io?.engine?.transport?.name || 'N/A'}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
};

// Keep the script running
console.log('Press Ctrl+C to exit\n');

// Show status every 5 seconds (optional - for monitoring)
// Uncomment if you want periodic status updates:
// setInterval(() => {
//   if (isConnected) {
//     checkConnectionStatus();
//   }
// }, 5000);

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\n👋 Shutting down...');
    checkConnectionStatus();
    if (socket.connected) {
        socket.close();
    }
    process.exit(0);
});
