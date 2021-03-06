const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const format = require("date-fns/format");

const databasePath = path.join(__dirname, "todoApplication.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined &&
    requestQuery.status !== undefined &&
    requestQuery.category !== undefined &&
    requestQuery.due_date !== undefined
  );
};

const hasDueDateProperty = (requestQuery) => {
  return requestQuery.due_date !== undefined;
};

const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status, category, due_date } = request.query;
  if (due_date)
    if (status !== undefined) {
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
        return;
      }
    }
  if (priority !== undefined) {
    if (priority === "HIGH" || priority === "LOW" || priority === "MEDIUM") {
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
      return;
    }
  }

  if (category !== undefined) {
    if (category === "WORK" || category === "HOME" || category === "LEARNING") {
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
      return;
    }
  }
  if (due_date !== undefined) {
    //????
  }

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}'
        AND priority = '${priority}'
        AND category = '${category}'
        AND due_date = '${due_date}';`;
      break;
    case hasPriorityProperty(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND priority = '${priority}';`;
      break;
    case hasStatusProperty(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}';`;
      break;
    case hasCategoryProperty(request.query):
      getTodosQuery = `
        SELECT 
        * 
        FROM 
        todo 
        WHERE 
        todo LIKE '%${search_q}%' 
        AND category = '${category}';`;
      break;
    case hasDueDateProperty(request.query):
      getTodosQuery = `
        SELECT 
        * 
        FROM 
        todo 
        WHERE 
        todo LIKE '%${search_q}%'
        AND due_date = '${due_date}';`;
      break;
    default:
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%';`;
  }

  data = await database.all(getTodosQuery);
  response.send(data);
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE
      id = ${todoId};`;
  const todo = await database.get(getTodoQuery);
  response.send(todo);
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, due_date } = request.body;
  if (status !== undefined) {
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
      return;
    }
  }
  if (priority !== undefined) {
    if (priority === "HIGH" || priority === "LOW" || priority === "MEDIUM") {
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
      return;
    }
  }
  if (category !== undefined) {
    if (category === "WORK" || category === "HOME" || category === "LEARNING") {
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
      return;
    }
  }

  if (due_date !== undefined) {
    /// ????
  }
  const postTodoQuery = `
  INSERT INTO
    todo (id, todo, priority, status, category, due_date)
  VALUES
    (${id}, '${todo}', '${priority}', '${status}', '${category}', '${due_date}');`;
  await database.run(postTodoQuery);
  response.send("Todo Successfully Added");
});
// how to give the invalid apis put method
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
    case requestBody.category !== undefined:
      updateColumn = "Category";
      break;
    case requestBody.due_date !== undefined:
      updateColumn = "dueDate";
      break;
  }
  const previousTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE 
      id = ${todoId};`;
  const previousTodo = await database.get(previousTodoQuery);

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    due_date = previousTodo.due_date,
  } = request.body;

  const updateTodoQuery = `
    UPDATE
      todo
    SET
      todo='${todo}',
      priority='${priority}',
      status='${status}',
      category = '${category}';
    WHERE
      id = ${todoId};`;

  await database.run(updateTodoQuery);
  response.send(`${updateColumn} Updated`);
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
  DELETE FROM
    todo
  WHERE
    id = ${todoId};`;

  await database.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

app.get("/agenda/", async (request, response) => {
  const date = format(new Date(2021, 1, 21), "yyyy-MM-dd");
  const getQuery = `SELECT * FROM todo WHERE due_date = ${date};`;
  const result = await database.get(getQuery);
  response.send(result);
});

module.exports = app;
