const express = require("express");
const sqlite = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
var parseISO = require("date-fns/parseISO");
var isMatch = require("date-fns/isMatch");
var format = require("date-fns/format");
// var isMatch = require("date-fns/isMatch");

const app = express();
app.use(express.json());

const { open } = sqlite;
const path = require("path");
const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;

const initializeDBandServer = async () => {
  try {
    app.listen(3000, () => {
      console.log("Server Running on Port 3000");
    });
    db = await open({ filename: dbPath, driver: sqlite3.Database });
  } catch (error) {
    console.log(`DB Encountered Error :${e.message}`);
    process.exit(1);
  }
};

initializeDBandServer();

const conversionOfDBObjectToResponseObjectForAPI1 = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    status: dbObject.status,
    category: dbObject.category,
    dueDate: dbObject.due_date,
  };
};

const isValidStatus = (request, response, next) => {
  let statusFromQueryOrBody;
  const { status } = request.query;
  statusFromQueryOrBody = status;
  //   console.log(statusFromQueryOrBody);
  if (statusFromQueryOrBody === undefined) {
    // console.log("Request Body");
    let { status } = request.body;
    statusFromQueryOrBody = status;
  }
  //   console.log(statusFromQueryOrBody);

  if (statusFromQueryOrBody !== undefined) {
    if (["TO DO", "IN PROGRESS", "DONE"].includes(statusFromQueryOrBody)) {
      //   console.log("validated");
      next();
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else {
    next();
  }
};

const isValidPriority = (request, response, next) => {
  let priorityFromQueryOrBody;
  const { priority } = request.query;
  priorityFromQueryOrBody = priority;
  //   console.log(priorityFromQueryOrBody);
  if (priorityFromQueryOrBody === undefined) {
    // console.log("Request Body");
    let { priority } = request.body;
    priorityFromQueryOrBody = priority;
  }
  //   console.log(priorityFromQueryOrBody);

  if (priorityFromQueryOrBody !== undefined) {
    if (["HIGH", "MEDIUM", "LOW"].includes(priorityFromQueryOrBody)) {
      next();
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
    }
  } else {
    next();
  }
};

const isValidCategory = (request, response, next) => {
  let categoryFromQueryOrBody;
  const { category } = request.query;
  categoryFromQueryOrBody = category;
  //   console.log(categoryFromQueryOrBody);
  if (categoryFromQueryOrBody === undefined) {
    // console.log("Request Body");
    let { category } = request.body;
    categoryFromQueryOrBody = category;
  }
  //   console.log(categoryFromQueryOrBody);

  if (categoryFromQueryOrBody !== undefined) {
    if (["WORK", "HOME", "LEARNING"].includes(categoryFromQueryOrBody)) {
      next();
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
    }
  } else {
    next();
  }
};

const isValidDueDate = (request, response, next) => {
  let dateFromQueryOrBody;
  const { date } = request.query;
  dateFromQueryOrBody = date;
  //   console.log(dateFromQueryOrBody);
  if (dateFromQueryOrBody === undefined) {
    // console.log("Request Body");
    let { dueDate } = request.body;
    dateFromQueryOrBody = dueDate;
  }
  //   console.log(dateFromQueryOrBody);

  if (dateFromQueryOrBody !== undefined) {
    //   console.log(isMatch(date, "yyyy-MM-dd"));
    if (isMatch(dateFromQueryOrBody, "yyyy-MM-dd")) {
      next();
    } else {
      response.status(400);
      response.send("Invalid Due Date");
    }
  } else {
    next();
  }
};

//Create table todo
app.get("/", async (request, response) => {
  const createTableQuery = `
                            create table
                                todo
                            (id INTEGER primary key AUTOINCREMENT,
                            todo text,
                            category text,
                            priority text,
                            status text,
                            due_date date);
                            `;
  await db.run(createTableQuery);
  response.send("Table created Successfully");
});

// API-1 Get All Todos

app.get(
  "/todos/",
  isValidStatus,
  isValidPriority,
  isValidCategory,
  async (request, response) => {
    const { status, priority, category, search_q } = request.query;

    let getAllTodosQuery = null;
    if (
      status !== undefined &&
      priority === undefined &&
      search_q === undefined &&
      category === undefined
    ) {
      getAllTodosQuery = `
                            select 
                                * 
                            from 
                                todo
                            where
                                status like '%${status}%'
                            ;`;
    } else if (
      status === undefined &&
      priority !== undefined &&
      search_q === undefined &&
      category === undefined
    ) {
      getAllTodosQuery = `
                            select 
                                * 
                            from 
                                todo
                            where
                                priority like '%${priority}%'
                            ;`;
    } else if (
      status !== undefined &&
      priority !== undefined &&
      search_q === undefined &&
      category === undefined
    ) {
      getAllTodosQuery = `
                            select 
                                * 
                            from 
                                todo
                            where
                                status like '%${status}%' and
                                priority like '%${priority}%'
                            ;`;
    } else if (
      status === undefined &&
      priority === undefined &&
      search_q !== undefined &&
      category === undefined
    ) {
      getAllTodosQuery = `
                            select 
                                * 
                            from 
                                todo
                            where
                                todo like '%${search_q}%' 
                            ;`;
    } else if (
      status !== undefined &&
      priority === undefined &&
      search_q === undefined &&
      category !== undefined
    ) {
      getAllTodosQuery = `
                            select 
                                * 
                            from 
                                todo
                            where
                                status like '%${status}%' and
                                category like '%${category}%'
                            ;`;
    } else if (
      status === undefined &&
      priority === undefined &&
      search_q === undefined &&
      category !== undefined
    ) {
      getAllTodosQuery = `
                            select 
                                * 
                            from 
                                todo
                            where
                                category like '%${category}%'
                            ;`;
    } else if (
      status === undefined &&
      priority !== undefined &&
      search_q === undefined &&
      category !== undefined
    ) {
      getAllTodosQuery = `
                            select 
                                * 
                            from 
                                todo
                            where
                                priority like '%${priority}%' and
                                category like '%${category}%'
                            ;`;
    } else if (
      status === undefined &&
      priority === undefined &&
      search_q === undefined &&
      category === undefined
    ) {
      getAllTodosQuery = `
                            select 
                                * 
                            from 
                                todo
                            ;`;
    }
    const TodosArray = await db.all(getAllTodosQuery);
    const responseTodosArray = TodosArray.map((eachTodo) =>
      conversionOfDBObjectToResponseObjectForAPI1(eachTodo)
    );
    //   console.log(responsePlayersArray);
    response.send(responseTodosArray);
  }
);

// API-2 Get Specific Todo

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
                            select 
                                * 
                            from 
                                todo
                            where
                                id like '%${todoId}%'
                            ;`;

  const todoItem = await db.get(getTodoQuery);
  const responseTodoItem = conversionOfDBObjectToResponseObjectForAPI1(
    todoItem
  );
  response.send(responseTodoItem);
});

// API-3 list of all todos with a specific due date

app.get("/agenda/", isValidDueDate, async (request, response) => {
  const { date } = request.query;
  const parsedDate = parseISO(date);
  //   console.log(parsedDate);
  const formattedDate = format(parsedDate, "yyyy-MM-dd");
  //   console.log(formattedDate);
  const getTodosQuery = `
                            select 
                                * 
                            from 
                                todo
                            where
                                due_date like '${formattedDate}̥'
                            ;`;
  const todoItems = await db.all(getTodosQuery);
  //   console.log(todoItems);
  const responseTodoItemsArray = todoItems.map((eachTodo) =>
    conversionOfDBObjectToResponseObjectForAPI1(eachTodo)
  );
  //   console.log(responseTodoItemsArray);
  response.send(responseTodoItemsArray);
});

// API-4 Create Todo Item

app.post(
  "/todos/",
  isValidStatus,
  isValidPriority,
  isValidCategory,
  isValidDueDate,
  async (request, response) => {
    const { id, todo, priority, status, category, dueDate } = request.body;
    // console.log(dueDate);
    const createTodoQuery = `
                            insert into todo
                                (id,todo, priority, status, category, due_date)
                            values 
                                (${id},'${todo}', '${priority}', '${status}','${category}','${dueDate}')
                            ;`;
    const result = await db.run(createTodoQuery);
    // console.log(result);
    response.send("Todo Successfully Added");
  }
);

// API-5 Modify Specific Todo

app.put(
  "/todos/:todoId/",
  isValidStatus,
  isValidPriority,
  isValidCategory,
  isValidDueDate,
  async (request, response) => {
    const { todoId } = request.params;
    const { status, priority, todo, category, dueDate } = request.body;
    let actionOnTodosQuery = null;
    //   console.log(request.body);
    if (
      status !== undefined &&
      priority === undefined &&
      todo === undefined &&
      category === undefined &&
      dueDate === undefined
    ) {
      actionOnTodosQuery = `
                            update todo
                            set status = '${status}' 
                            where
                                id like '%${todoId}%'
                            ;`;
      await db.run(actionOnTodosQuery);
      response.send("Status Updated");
    } else if (
      status === undefined &&
      priority !== undefined &&
      todo === undefined &&
      category === undefined &&
      dueDate === undefined
    ) {
      actionOnTodosQuery = `
                            update todo
                            set priority = '${priority}' 
                            where
                                id like '%${todoId}%'
                            ;`;
      await db.run(actionOnTodosQuery);
      response.send("Priority Updated");
    } else if (
      status === undefined &&
      priority === undefined &&
      todo !== undefined &&
      category === undefined &&
      dueDate === undefined
    ) {
      actionOnTodosQuery = `
                            update todo
                            set todo = '${todo}' 
                            where
                                id like '%${todoId}%'
                            ;`;
      await db.run(actionOnTodosQuery);
      response.send("Todo Updated");
    } else if (
      status === undefined &&
      priority === undefined &&
      todo === undefined &&
      category !== undefined &&
      dueDate === undefined
    ) {
      actionOnTodosQuery = `
                            update todo
                            set category = '${category}' 
                            where
                                id like '%${todoId}%'
                            ;`;
      await db.run(actionOnTodosQuery);
      response.send("Category Updated");
    } else if (
      status === undefined &&
      priority === undefined &&
      todo === undefined &&
      category === undefined &&
      dueDate !== undefined
    ) {
      actionOnTodosQuery = `
                            update todo
                            set due_date = '${dueDate}' 
                            where
                                id like '%${todoId}%'
                            ;`;
      await db.run(actionOnTodosQuery);
      response.send("Due Date Updated");
    }
  }
);

// API-5 Delete Specific Todo

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
                            delete 
                            from 
                                todo
                            where
                                id like '%${todoId}%'
                            ;`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
