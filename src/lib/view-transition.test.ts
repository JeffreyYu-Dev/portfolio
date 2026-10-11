import assert from "node:assert/strict";
import { test } from "node:test";
import { transitionTypes, viewTransitionName } from "./view-transition.ts";

const at = (pathname: string) => ({ pathname });

test("names are derived from the work id", () => {
  assert.equal(viewTransitionName("Lyft"), "work-Lyft");
  assert.equal(viewTransitionName("Lyft", "icon"), "work-Lyft-icon");
  assert.equal(viewTransitionName("Lyft", "title"), "work-Lyft-title");
});

test("names are always valid css identifiers", () => {
  assert.equal(viewTransitionName("Big Co & Sons"), "work-Big-Co---Sons");
  assert.equal(viewTransitionName("3m", "icon"), "work-3m-icon");
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
