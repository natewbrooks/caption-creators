# Caption Creators

> Developed by team **Burnt Toast** - Nate Brooks, Gabriel Huber, Connor O’Grady, David Borisevich, and Dominick Winningham

<br>

## Getting Started

> This is a [Next.js](https://nextjs.org/) project. To run, make sure you have [Node and npm](https://nodejs.org/en) installed.

1. **Navigate to the directory where you cloned this repository in your preferred IDE.**

    ```bash
    cd '/your/repo/filepath/here'
    ```

2. **Install the project dependencies locally by running the following command:** 

    ```bash
    npm install
    ```

3. **Start the development server:**

    ```bash
    npm run dev
    ```

   - Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
   - You can open multiple [http://localhost:3000](http://localhost:3000) tabs to utilize the multiplayer functionality locally.
<br>

## Setting up Leaderboard MySQL Database Locally

1. **Download and Install MySQL**
    - Download MySQL from the official site: [MySQL Downloads](https://dev.mysql.com/downloads/mysql/).
    - During installation, choose a secure password and remember it, it will be used later.
  
2. **Configure System Path**
    - Navigate to the MySQL installation bin directory. The default path on Windows OS is: `C:\Program Files\MySQL\MySQL Server X.Y\bin`
    - Add the bin directory to your system's PATH:
        - Open Start Menu, search for "Environment Variables".
        - Click on "Environment Variables" at the bottom of the System Properties window.
        - In the "System variables" section, select the Path variable and click Edit.
        - Click New and enter the path to the MySQL bin directory.
        - Click OK and close out of Environment Variables tabs.
     
3. **Access MySQL via Command Prompt**
    - Open Command Prompt.
    - Connect to MySQL by executing: `mysql -u root -p`. Enter your password when prompted.

### MySQL Database and Users Table Setup

Execute the following SQL commands to create the database and configure the user:

```sql
CREATE DATABASE leaderboard;
USE leaderboard;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    userToken CHAR(36) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    score INT DEFAULT 0
);

CREATE USER 'leaderboard_user'@'localhost' IDENTIFIED BY 'pass@123';
GRANT SELECT, INSERT, UPDATE, DELETE ON leaderboard.* TO 'leaderboard_user'@'localhost';
FLUSH PRIVILEGES;
```

<br>

## Setting Up API Key Environment Variables

Enables use of OpenAI chat generation and YouTube searches

1. **Create the `.env.local` File**
   - Navigate to your project's root directory.
   - Create a new file named `.env.local`.

2. **Add the Environment Variables**
   - Open the `.env.local` file in a text editor.
   - Add the following environment variables:

    ```plaintext
    # API keys
    OPENAI_API_KEY="YOUR-OPENAI-API-KEY"
    YOUTUBE_API_KEY="YOUR-YOUTUBE-API-KEY"

    # Server configuration
    SERVER_URL="http://3.223.225.252"
    ```

3. **Save and Verify**
   - Save the `.env.local` file.
   - Ensure that the variables are correctly loaded by calling them; generating or submitting a prompt call the OpenAI and YouTube API's respectively.
