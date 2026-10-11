import assert from "node:assert/strict";
import { test } from "node:test";
import { work } from "../data/work.ts";
import { transitionTypes, vt } from "./view-transition.ts";

const at = (pathname: string) => ({ pathname });

test("names are derived from the work id", () => {
  assert.equal(vt("Lyft").viewTransitionName, "work-Lyft");
  assert.equal(vt("Lyft", "icon").viewTransitionName, "work-Lyft-icon");
  assert.equal(vt("Lyft", "title").viewTransitionName, "work-Lyft-title");
});

test("each part gets the class styles.css animates", () => {
  assert.equal(vt("Lyft").viewTransitionClass, "work-box");
  assert.equal(vt("Lyft", "icon").viewTransitionClass, "work-icon");
  assert.equal(vt("Lyft", "title").viewTransitionClass, "work-title");
});

test("names are always valid css identifiers", () => {
  assert.equal(vt("Big Co & Sons").viewTransitionName, "work-Big-Co---Sons");
  assert.equal(vt("3m", "icon").viewTransitionName, "work-3m-icon");
});

// duplicate names make the browser skip the whole transition
test("every work entry gets a unique name", () => {
  const names = work.map((w) => vt(w.id).viewTransitionName);
  assert.equal(new Set(names).size, names.length);
});

test("home to work is forward", () => {
  assert.deepEqual(
    transitionTypes({ fromLocation: at("/"), toLocation: at("/work/Lyft") }),
    ["forward"],
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
