const fs = require("node:fs");
const fsPromise = require("node:fs/promises");
const express = require("express");

const app = express();

const PORT = 3000;
const USERS_FILE = "users.json";

const getUsers = () => {
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([]));
    return [];
  } else {
    const result = fs.readFileSync(USERS_FILE, {
      encoding: "utf-8",
    });
    return JSON.parse(result);
  }
};

const checkReqBody = (req, res, next) => {
  const data = req.body;
  if (!data) {
    return res.status(400).json({
      success: false,
      message: "Invalid user data",
    });
  }

  next();
};

const checkUserId = (req, res, next) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ success: false, message: "Invalid user ID" });
  }

  const userIndex = users.findIndex((user) => user.id === id);
  if (userIndex === -1) {
    return res
      .status(404)
      .json({ success: false, message: "User ID not found" });
  }

  req.userIndex = userIndex;
  next();
};

const users = getUsers();

app.use(express.json());

/**
 * URL: POST /user
 * Adds a new user to your users stored in a JSON file
 * Ensures that the email of the new user doesn’t exist before
 */
app.post("/user", checkReqBody, async (req, res) => {
  const { email, name, age } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Email is required",
    });
  }

  if (users.some((user) => user.email === email)) {
    return res.status(409).json({
      success: false,
      message: "Email already exists",
    });
  }

  const id = users.length > 0 ? Math.max(...users.map((u) => u.id)) + 1 : 1;

  users.push({ id, email, name, age });

  try {
    await fsPromise.writeFile(USERS_FILE, JSON.stringify(users));

    return res.status(201).json({
      success: true,
      message: "User added successfully",
    });
  } catch (error) {
    throw new Error(`Failed to save changes: ${error.message}`);
  }
});

/**
 * URL: PATCH /user/:id
 * Updates an existing user's name, age, or email by their ID
 * The user ID should be retrieved from the params
 * Update the corresponding values in the JSON file
 */
app.patch("/user/:id", checkUserId, checkReqBody, async (req, res) => {
  const { age, name, email } = req.body;
  const userIndex = req.userIndex;

  const currentUserData = users[userIndex];
  const newUserData = {
    id: currentUserData.id,
    age: age ?? currentUserData.age,
    name: name ?? currentUserData.name,
    email: email ?? currentUserData.email,
  };

  users.splice(userIndex, 1, newUserData);

  try {
    await fsPromise.writeFile(USERS_FILE, JSON.stringify(users));

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
    });
  } catch (error) {
    throw new Error(`Failed to save changes: ${error.message}`);
  }
});

/**
 * URL: DELETE /user/{:id}
 * Deletes a User by ID.
 * The user ID should be retrieved from either the request body or optional params
 * Delete the user from the file
 */
app.delete("/user/{:id}", async (req, res) => {
  let id = req.params.id ?? req.body?.id;
  if (!id) {
    return res.status(400).json({ success: false, message: "Missing user ID" });
  }

  id = parseInt(id);
  if (isNaN(id)) {
    return res.status(400).json({ success: false, message: "Invalid user ID" });
  }

  const userIndex = users.findIndex((user) => user.id === id);
  if (userIndex === -1) {
    return res
      .status(404)
      .json({ success: false, message: "User ID not found" });
  }

  users.splice(userIndex, 1);

  try {
    await fsPromise.writeFile(USERS_FILE, JSON.stringify(users));

    return res
      .status(200)
      .json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    throw new Error(`Failed to save changes: ${error.message}`);
  }
});

/**
 * URL: GET /user/getByName?name=
 * Gets a user by their name
 * The name will be provided as a query parameter
 */
app.get("/user/getByName", (req, res) => {
  let userName = req.query.name;

  if (!userName) {
    return res.status(400).json({
      success: false,
      message: "Missing name query parameter",
    });
  }

  userName = userName.toLocaleLowerCase();

  const user = users.find((user) => user.name.toLocaleLowerCase() === userName);
  if (!user) {
    return res
      .status(404)
      .json({ success: false, message: "User name not found" });
  }

  return res.status(200).json({
    success: true,
    message: "User retrieved successfully",
    data: user,
  });
});

/**
 * URL: GET /user
 * Gets all users from the JSON file
 */
app.get("/user", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Users retrieved successfully",
    data: users,
  });
});

/**
 * URL: GET /user/filter?minAge=
 * Filters users by minimum age
 */
app.get("/user/filter", (req, res) => {
  let minAge = req.query.minAge;

  if (!minAge) {
    return res.status(400).json({
      success: false,
      message: "Missing minAge query parameter",
    });
  }

  minAge = parseInt(minAge);
  if (isNaN(minAge)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid minAge value" });
  }

  const filteredUsers = users.filter((user) => user.age >= minAge);
  if (filteredUsers.length === 0) {
    return res.status(404).json({ success: false, message: "No users found" });
  }

  return res.status(200).json({
    success: true,
    message: "User retrieved successfully",
    data: filteredUsers,
  });
});

/**
 * URL: GET /user/:id
 * Gets User by ID
 */
app.get("/user/:id", checkUserId, (req, res) => {
  const userIndex = req.userIndex;

  const user = users[req.userIndex];

  return res.status(200).json({
    success: true,
    message: "User retrieved successfully",
    data: user,
  });
});

app.use((err, req, res, next) => {
  res
    .status(500)
    .json({ success: false, message: `Something went wrong, ${err.message}` });
});

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
