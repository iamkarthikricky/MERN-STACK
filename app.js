const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const { isValid, parse, format } = require("date-fns");

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

const dateFormat = (query) => {
  return {
    id: query.id,
    todo: query.todo,
    priority: query.priority,
    status: query.status,
    category: query.category,
    dueDate: query.due_date, //format(query.due_date, "yyyy-MM-dd"),
  };
};
const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasCategoryAndStatus = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const hasCategoryAndPriority = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

const priorityValues = ["HIGH", "MEDIUM", "LOW"];
const statusValues = ["TO DO", "IN PROGRESS", "DONE"];
const categoryValues = ["WORK", "HOME", "LEARNING"];

app.get("/todos/", async (request, response) => {
  const { search_q = "", priority, status, category } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      const priorAndStatusQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}'
        AND priority = '${priority}';`;
      const psQueryRun = await database.all(priorAndStatusQuery);
      response.send(psQueryRun.map((query) => dateFormat(query)));
      break;
    case hasPriorityProperty(request.query):
      const isTrue = priorityValues.includes(priority);
      const getPriorQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND priority = '${priority}';`;
      const priorityQueryRun = await database.all(getPriorQuery);
      if (isTrue === false) {
        response.status(400);
        response.send("Invalid Todo Priority");
      } else {
        response.send(priorityQueryRun.map((query) => dateFormat(query)));
      }
      break;
    case hasStatusProperty(request.query):
      const isStatusTrue = statusValues.includes(status);
      const getStatusQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}';`;
      const statusQueryRun = await database.all(getStatusQuery);
      if (isStatusTrue === false) {
        response.status(400);
        response.send("Invalid Todo Status");
      } else {
        response.send(statusQueryRun.map((query) => dateFormat(query)));
      }
      break;
    case hasCategoryAndStatus(request.query):
      const getCatAndStatQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND category= '${category}'
        AND status = '${status}';`;
      const CatStaQueryRun = await database.all(getCatAndStatQuery);
      response.send(CatStaQueryRun.map((query) => dateFormat(query)));
      break;
    case hasCategoryProperty(request.query):
      const isCategoryTrue = categoryValues.includes(category);
      const getCategoryQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND category= '${category}';`;
      const categoryQueryRun = await database.all(getCategoryQuery);
      if (isCategoryTrue === false) {
        response.status(400);
        response.send("Invalid Todo Category");
      } else {
        response.send(categoryQueryRun.map((query) => dateFormat(query)));
      }
      break;
    case hasCategoryAndPriority(request.query):
      const getCatAndPriorQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND category= '${category}'
        AND priority='${priority}';`;
      const catPriorQueryRun = await database.all(getCatAndPriorQuery);
      response.send(catPriorQueryRun.map((query) => dateFormat(query)));
      break;
    default:
      const getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%';`;
      const searchQuery = await database.all(getTodosQuery);
      response.send(searchQuery.map((query) => dateFormat(query)));
  }
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
  response.send(dateFormat(todo));
});

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  const parsedDate = parse(date, "yyyy-MM-dd", new Date());
  const validateDate = isValid(parsedDate);

  if (validateDate == false) {
    response.status(400);
    response.send("Invalid Due Date");
  } else {
    const formatDate = format(new Date(date), "yyyy-MM-dd");
    const dateQuery = `SELECT * FROM todo WHERE due_date='${formatDate}';`;
    const runDateQuery = await database.all(dateQuery);
    response.send(runDateQuery.map((query) => dateFormat(query)));
  }
});
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;

  const isTruePriority = priorityValues.includes(priority);
  const isTrueStatus = statusValues.includes(status);
  const isTrueCategory = categoryValues.includes(category);
  const parsedDate = parse(dueDate, "yyyy-MM-dd", new Date());
  const validateDate = isValid(parsedDate);
  if (isTruePriority === false) {
    response.status(400);
    response.send("Invalid Todo Priority");
  } else if (isTrueStatus === false) {
    response.status(400);
    response.send("Invalid Todo Status");
  } else if (isTrueCategory === false) {
    response.status(400);
    response.send("Invalid Todo Category");
  } else if (validateDate === false) {
    response.status(400);
    response.send("Invalid Due Date");
  } else {
    const formatDueDate = format(new Date(dueDate), "yyyy-MM-dd");
    const postQuery = `INSERT INTO todo(id, todo, category, priority, status,due_date) VALUES(${id},'${todo}','${category}','${priority}','${status}',
    '${formatDueDate}')`;
    const postTodo = await database.run(postQuery);
    response.send("Todo Successfully Added");
  }
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
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
    category = previousTodo.category,
    priority = previousTodo.priority,
    status = previousTodo.status,
    dueDate = previousTodo.due_date,
  } = request.body;

  const isTruePriority = priorityValues.includes(priority);
  const isTrueStatus = statusValues.includes(status);
  const isTrueCategory = categoryValues.includes(category);
  const parsedDate = parse(dueDate, "yyyy-MM-dd", new Date());
  const validateDate = isValid(parsedDate);

  if (isTruePriority === false) {
    response.status(400);
    response.send("Invalid Todo Priority");
  } else if (isTrueStatus === false) {
    response.status(400);
    response.send("Invalid Todo Status");
  } else if (isTrueCategory === false) {
    response.status(400);
    response.send("Invalid Todo Category");
  } else if (validateDate === false) {
    response.status(400);
    response.send("Invalid Due Date");
  } else {
    let updateColumn = "";
    switch (true) {
      case request.body.status !== undefined:
        updateColumn = "Status";
        break;
      case request.body.priority !== undefined:
        updateColumn = "Priority";
        break;
      case request.body.todo !== undefined:
        updateColumn = "Todo";
        break;
      case request.body.category !== undefined:
        updateColumn = "Category";
        break;
      case request.body.dueDate !== undefined:
        updateColumn = "Due Date";
        break;
    }

    const updateTodoQuery = `
    UPDATE
      todo
    SET
      todo='${todo}',
      category='${category}',
      priority='${priority}',
      status='${status}',
      due_date='${dueDate}'
    WHERE
      id = ${todoId};`;

    await database.run(updateTodoQuery);
    response.send(`${updateColumn} Updated`);
  }
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const deleteQuery = `DELETE FROM todo WHERE id=${todoId};`;
  await database.run(deleteQuery);
  response.send("Todo Deleted");
});

module.exports = app;
