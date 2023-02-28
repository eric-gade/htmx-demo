import { Application, Router } from "https://deno.land/x/oak/mod.ts";
import {
  etaEngine,
  oakAdapter,
  viewEngine,
} from "https://deno.land/x/view_engine@v10.6.0/mod.ts";
import { ejsEngine } from "https://deno.land/x/view_engine@v10.5.1/mod.ts";

const app = new Application();
const router = new Router();

const SESSION_TODOS = [
  { text: "First Item", isChecked: false, id: 0 },
  { text: "Second Item", isChecked: false, id: 1 },
];

app.use(
  viewEngine(oakAdapter, ejsEngine, {
    viewRoot: `${Deno.cwd()}/views/`,
  })
);

router.get("/", async (ctx) => {
  await ctx.render("index.eta", { todos: SESSION_TODOS });
});

router.post("/todo/:id", async (ctx) => {
  const body = await ctx.request.body({ type: "form" });
  const formValue = await body.value;
  const index = Number(ctx.params.id);
  const item = SESSION_TODOS[index];
  item.isChecked = formValue.get("checkbox");
  item.text = formValue.get("text");
  const responseItem = Object.assign({}, item, { id: index });
  await ctx.render("todo-item.eta", responseItem);
});

router.post("/todo", async (ctx) => {
  const size = SESSION_TODOS.length;
  const newItem = { text: `New Item ${size}`, id: size, isChecked: false };
  SESSION_TODOS.push(newItem);
  await ctx.render("todo-item.eta", newItem);
});

router.delete("/todo/:id", async (ctx) => {
  const id = Number(ctx.params.id);
  const foundItem = SESSION_TODOS.findIndex((item) => {
    return item.id === id;
  });

  if (foundItem >= 0) {
    SESSION_TODOS.splice(foundItem, 1);
    ctx.response.status = 200;
  } else {
    ctx.response.status = 404;
  }
});

app.use(router.routes());
app.use(router.allowedMethods());

// Static files
app.use(async (context, next) => {
  try {
    await context.send({
      root: `${Deno.cwd()}/static`,
      index: "index.html",
    });
  } catch {
    await next();
  }
});

await app.listen({ port: 8000 });
