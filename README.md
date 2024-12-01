# Friend-Chat

Friend-Chat is a real-time chat application built with React and Vite. It utilizes Socket.IO for real-time communication and MongoDB for data storage.

## Features

- Real-time messaging
- User authentication
- Profile picture updates
- Message read receipts
- Group chat functionality
- Logging options for chat history
- Complete deletion of meseege From everywhere
- Send files upto to 50 Mb// You can increse size But first cheack your database size I am using free Verision of Mongo Db atlas
- Responsive design

## Technologies Used

- **Frontend**: React, Vite, Socket.IO, Styled Components
- **Backend**: Express, Socket.IO, MongoDB, Mongoose

## Getting Started

### Prerequisites

- Node.js (version 18 or higher)
- npm or yarn

### Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the root of the frontend directory and add the following:

   ```env
   VITE_API_URL=<your-backend-url>
   ```

   Replace `<your-backend-url>` with the URL of your backend server.

### Running the Application

To start the development server, run:

```bash
npm run dev
```

This will start the application on `http://localhost:5173`.

### Building for Production

To build the application for production, run:

```bash
npm run build
```

The production files will be generated in the `dist` directory.

### Linting

To run the linter, use:

```bash
npm run lint
```

## Usage

- Open the application in your browser.
- You can log in with predefined users or create new accounts.
- Start chatting with other users in real-time.
- Create or join group chats to communicate with multiple users simultaneously.
- Access chat logs to review past conversations.

## Future Updates

- Implement video and voice calling features.
- Enhance user profile customization options.
- Introduce end-to-end encryption for messages.
- Add notifications for new messages and events.
- Improve UI/UX for better user engagement.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

This project is licensed under the MIT License.