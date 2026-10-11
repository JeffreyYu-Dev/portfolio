import assert from "node:assert/strict";
import { test } from "node:test";
import { projects } from "../data/projects.ts";
import { work } from "../data/work.ts";
import { transitionTypes, vt } from "./view-transition.ts";

const at = (pathname: string) => ({ pathname });

test("names are derived from the section and id", () => {
  assert.equal(vt("work", "Lyft").viewTransitionName, "work-Lyft");
  assert.equal(vt("work", "Lyft", "icon").viewTransitionName, "work-Lyft-icon");
  assert.equal(
    vt("project", "Lyft", "title").viewTransitionName,
    "project-Lyft-title",
  );
});

test("each part gets the class styles.css animates", () => {
  assert.equal(vt("work", "Lyft").viewTransitionClass, "item-box");
  assert.equal(vt("work", "Lyft", "icon").viewTransitionClass, "item-icon");
  assert.equal(vt("project", "a", "title").viewTransitionClass, "item-title");
});

test("names are always valid css identifiers", () => {
  assert.equal(
    vt("work", "Big Co & Sons").viewTransitionName,
    "work-Big-Co---Sons",
  );
  assert.equal(vt("project", "3d", "icon").viewTransitionName, "project-3d-icon");
});

// duplicate names make the browser skip the whole transition
test("every work and project entry gets a unique name", () => {
  const names = [
    ...work.map((w) => vt("work", w.id).viewTransitionName),
    ...projects.map((p) => vt("project", p.id).viewTransitionName),
  ];
  assert.equal(new Set(names).size, names.length);
});

test("home to work is forward", () => {
  assert.deepEqual(
    transitionTypes({ fromLocation: at("/"), toLocation: at("/work/Lyft") }),
    ["forward"],
  );
});

test("home to a project is forward, and back again", () => {
  assert.deepEqual(
    transitionTypes({ fromLocation: at("/"), toLocation: at("/projects/x") }),
    ["forward"],
  );
  assert.deepEqual(
    transitionTypes({ fromLocation: at("/projects/x"), toLocation: at("/") }),
    ["back"],
  );
});

test("work to home is back", () => {
  assert.deepEqual(
    transitionTypes({ fromLocation: at("/work/Lyft"), toLocation: at("/") }),
    ["back"],
  );
});

test("everything else is a fade", () => {
  assert.deepEqual(
    transitionTypes({ fromLocation: at("/"), toLocation: at("/posts/1") }),
    ["fade"],
  );
  assert.deepEqual(
    transitionTypes({ fromLocation: at("/work/A"), toLocation: at("/work/B") }),
    ["fade"],
  );
});

test("no transition on first load or same-page navigation", () => {
  assert.equal(transitionTypes({ toLocation: at("/work/Lyft") }), false);
  assert.equal(
    transitionTypes({ fromLocation: at("/"), toLocation: at("/") }),
    false,
  );
});
