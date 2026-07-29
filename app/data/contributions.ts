/* ─── Open Source Contributions ────────────────────────────────
   Content-block schema so future contributions can be added as pure
   data without touching component code. */

export type ContentBlock =
  | { type: "p"; text: string }
  | { type: "h"; text: string }
  | { type: "code"; lang: string; code: string }
  | { type: "list"; items: string[] }
  | { type: "table"; headers: string[]; rows: string[][] };

export interface Contribution {
  slug: string;
  repo: string;
  repoUrl: string;
  stars: string;
  language: string;
  title: string;
  excerpt: string;
  prNumber: number;
  prUrl: string;
  prStatus: "open" | "merged";
  issueNumber: number;
  issueUrl: string;
  diffStat: string;
  tags: string[];
  body: ContentBlock[];
}

export const contributions: Contribution[] = [
  {
    slug: "pytorch-flight-recorder-gc",
    repo: "pytorch/pytorch",
    repoUrl: "https://github.com/pytorch/pytorch",
    stars: "102k",
    language: "Python",
    title: "Restoring the caller's GC state in PyTorch's Flight Recorder",
    excerpt:
      "A three-line fix to a permanent garbage-collector leak in PyTorch's distributed debugging tool — and the verification table that proves the tests actually catch the bug.",
    prNumber: 191439,
    prUrl: "https://github.com/pytorch/pytorch/pull/191439",
    prStatus: "open",
    issueNumber: 191396,
    issueUrl: "https://github.com/pytorch/pytorch/issues/191396",
    diffStat: "2 files · +67 / −24",
    tags: ["Python", "Distributed Systems", "Testing", "Open Source"],
    body: [
      {
        type: "p",
        text: "PyTorch is not a small project to cut your open-source teeth on. It has roughly 102,000 GitHub stars and a commit history past 108,000 commits on main. My first pull request there — #191439 — is small by the numbers: two files changed, 67 lines added, 24 removed. Getting those 91 lines right is what taught me the most, not about PyTorch specifically, but about what it actually means to prove a fix is correct instead of just believing it is.",
      },
      { type: "h", text: "The project" },
      {
        type: "p",
        text: "pytorch/pytorch is the reference implementation of the deep learning framework most of the industry trains on. My change lives in torch.distributed.flight_recorder — the tool PyTorch's distributed team built to debug multi-GPU training runs after the fact, by loading and analyzing trace dumps collected from every rank in a collective operation (mismatched tensor sizes, a rank that never joined a collective, that kind of failure).",
      },
      { type: "h", text: "The issue" },
      {
        type: "p",
        text: "I want to be precise about how I found this: I didn't discover it. PyTorch runs automated code-quality triage that opens real issues against real problems in the codebase. On the day I went looking for something to work on, that triage had filed six issues in a single batch, all labeled “good first issue” under oncall: distributed infra. I picked issue #191396 over the other five for one reason — it described an actual correctness bug, not a lint nit or a naming cleanup, and it shipped with a working reproduction script and a stated expected behavior. That meant I could verify I understood the bug correctly before writing a single line of the fix.",
      },
      { type: "h", text: "The bug" },
      {
        type: "p",
        text: "Flight Recorder's read_dir() function loads trace dump files from a directory and parses them. Trace dumps from a large training run can be large and numerous, so read_dir() calls gc.disable() on entry — turning off Python's cyclic garbage collector — presumably to avoid GC pauses while unpickling a lot of objects.",
      },
      {
        type: "p",
        text: "The problem: nothing in the module ever called gc.enable() again. Not on the success path. Not on any of the three ways the function can fail — the trace directory doesn't exist, no files matched the prefix, or reading a single dump raises. Call read_dir() once, and cyclic garbage collection is off for the rest of the process, permanently.",
      },
      {
        type: "code",
        lang: "python",
        code: `def read_dir(args: argparse.Namespace) -> tuple[dict[str, dict[str, Any]], str]:
    gc.disable()
    prefix = args.prefix
    details = {}
    t0 = time.time()
    version = ""
    filecount = 0
    if not os.path.isdir(args.trace_dir):
        raise AssertionError(f"folder {args.trace_dir} does not exist")
    for root, _, files in os.walk(args.trace_dir):
        if prefix is None:
            prefix = _determine_prefix(files)
        for f in files:
            if (offset := f.find(prefix)) == -1:
                continue
            details[f] = read_dump(f[:offset] + prefix, os.path.join(root, f))
            filecount += 1
            if not version:
                version = str(details[f]["version"])
    tb = time.time()
    if len(details) <= 0:
        raise AssertionError(
            f"no files loaded from {args.trace_dir} with prefix {prefix}"
        )
    logger.debug("loaded %s files in %ss", filecount, tb - t0)
    return details, version`,
      },
      {
        type: "p",
        text: "Any long-lived tool that imports this loader — and Flight Recorder is explicitly meant to be used interactively while debugging a stuck training job — silently stops collecting reference cycles the first time it reads a trace directory. It doesn't crash and it doesn't log anything. It just leaks slowly, for the rest of the process's life. I checked, and the bug was present in the shipped torch 2.11.0 release as well as on main — this isn't a regression from some in-flight change, it's been there.",
      },
      { type: "h", text: "The fix" },
      {
        type: "p",
        text: "The fix itself is three lines of actual logic: capture gc.isenabled() before disabling, wrap the body in try, restore the captured state in finally.",
      },
      {
        type: "p",
        text: "The detail that matters is that the restore is conditional. My first instinct — and I'd guess most people's first instinct — is to just call gc.enable() unconditionally in the finally block. That's wrong, and it's wrong in a subtle way: it turns collection back on even for a caller who had deliberately disabled GC before ever calling read_dir(). The fix has to restore the caller's exact prior state, not just flip collection back “on.”",
      },
      {
        type: "code",
        lang: "python",
        code: `def read_dir(args: argparse.Namespace) -> tuple[dict[str, dict[str, Any]], str]:
    gc_was_enabled = gc.isenabled()
    gc.disable()
    try:
        prefix = args.prefix
        details = {}
        t0 = time.time()
        version = ""
        filecount = 0
        if not os.path.isdir(args.trace_dir):
            raise AssertionError(f"folder {args.trace_dir} does not exist")
        for root, _, files in os.walk(args.trace_dir):
            if prefix is None:
                prefix = _determine_prefix(files)
            for f in files:
                if (offset := f.find(prefix)) == -1:
                    continue
                details[f] = read_dump(f[:offset] + prefix, os.path.join(root, f))
                filecount += 1
                if not version:
                    version = str(details[f]["version"])
        tb = time.time()
        if len(details) <= 0:
            raise AssertionError(
                f"no files loaded from {args.trace_dir} with prefix {prefix}"
            )
        logger.debug("loaded %s files in %ss", filecount, tb - t0)
        return details, version
    finally:
        if gc_was_enabled:
            gc.enable()`,
      },
      { type: "h", text: "The tests" },
      {
        type: "p",
        text: "I added a dedicated test class, FlightRecorderLoaderGCTest, with three cases: GC enabled and a successful read (should still be enabled afterward), GC enabled and a read that fails because the directory doesn't exist (should still be enabled afterward), and GC already disabled by the caller before calling read_dir() (should still be disabled afterward). setUp records whatever the ambient GC state is when the test starts and restores it via addCleanup, so a failing test can't leak a disabled collector into whatever test runs next in the suite.",
      },
      {
        type: "code",
        lang: "python",
        code: `class FlightRecorderLoaderGCTest(TestCase):
    def setUp(self):
        super().setUp()
        was_enabled = gc.isenabled()
        self.addCleanup(gc.enable if was_enabled else gc.disable)

    def _write_trace_dir(self, tmpdir):
        dump = {"entries": [], "version": "2.4", "pg_config": {}}
        with open(os.path.join(tmpdir, "trace_0"), "wb") as f:
            pickle.dump(dump, f)
        return argparse.Namespace(trace_dir=tmpdir, prefix="trace_")

    def test_gc_restored_on_success(self):
        gc.enable()
        with tempfile.TemporaryDirectory() as tmpdir:
            read_dir(self._write_trace_dir(tmpdir))
        self.assertTrue(gc.isenabled())

    def test_gc_restored_on_failure(self):
        gc.enable()
        args = argparse.Namespace(trace_dir="/does/not/exist", prefix=None)
        with self.assertRaises(AssertionError):
            read_dir(args)
        self.assertTrue(gc.isenabled())

    def test_gc_left_disabled_when_caller_disabled_it(self):
        gc.disable()
        with tempfile.TemporaryDirectory() as tmpdir:
            read_dir(self._write_trace_dir(tmpdir))
        self.assertFalse(gc.isenabled())`,
      },
      { type: "h", text: "Proving the tests actually work" },
      {
        type: "p",
        text: "A test suite that passes whether or not the bug is fixed doesn't prove anything. So before I trusted these three tests, I ran them against three different implementations of read_dir() and checked that each one failed exactly where it should:",
      },
      {
        type: "table",
        headers: ["Implementation", "Test 1 (success)", "Test 2 (failure)", "Test 3 (pre-disabled)"],
        rows: [
          ["Unfixed (original code)", "FAIL", "FAIL", "pass"],
          ["Naive fix (unconditional gc.enable())", "pass", "pass", "FAIL"],
          ["My fix", "pass", "pass", "pass"],
        ],
      },
      {
        type: "p",
        text: "Tests 1 and 2 fail against the original, unfixed code — that's what proves they actually catch the bug, not just that they run. Test 3 fails against the naive unconditional gc.enable() fix — that's what proves the suite catches the wrong fix too, not just the absence of any fix. Only the real fix passes all three, and none of the three tests is redundant with the other two.",
      },
      { type: "h", text: "Working around a multi-hour build" },
      {
        type: "p",
        text: "Building PyTorch from source is a multi-hour, multi-gigabyte undertaking — not something I wanted to do to validate a pure-Python change to one file. My fix and my tests never touch any compiled code, so I sidestepped the build entirely: I installed a PyTorch nightly wheel, then at test time loaded my patched loader.py source directly into the installed torch package's module namespace in memory, before running the real test_fr_analysis.py file against it. That let me exercise the actual test suite against my actual patch without compiling anything, and without modifying the installed package on disk.",
      },
      { type: "h", text: "Two false alarms" },
      {
        type: "list",
        items: [
          "My tests initially reported as failing — not because of my patch, but because the test runner was importing torch from site-packages (the installed nightly) rather than from my local checkout with the patch applied. The traceback's file paths gave it away once I looked closely instead of assuming my fix was wrong.",
          "PyTorch's PYREFLY type checker reported 18,195 errors when I ran it locally. Zero of them were in either file I changed. PYREFLY can't resolve the compiled torch._C extension module in an unbuilt checkout, so every torch.float32-style lookup across the entire codebase fails to type-check. The lesson wasn't really about PyTorch's tooling — it was about reading a scary-looking failure output carefully enough to notice that none of it points at your own diff before assuming you broke something.",
        ],
      },
      { type: "h", text: "The contribution process" },
      {
        type: "list",
        items: [
          "Commented on the issue with my intended approach — the try/finally, the conditional restore, my planned test cases — before writing any code, so a maintainer could redirect me before I'd invested time in the wrong fix.",
          "The diff is exactly two files, +67/−24, in a single commit.",
          "Signed the Linux Foundation's EasyCLA, required for any external contribution to PyTorch.",
          "Added the “topic: not user facing” release-notes label myself via a @pytorchbot comment — external contributors can't apply labels directly, so the bot is the mechanism.",
          "A PyTorch collaborator reviewed and approved the PR. As of writing it's approved and open, not yet merged — I'm leaving that accurate rather than rounding it up.",
        ],
      },
      { type: "h", text: "What I'd do differently" },
      {
        type: "p",
        text: "I'd write the verification table before writing the fix, not after. Proving a test can fail is more informative than watching it pass, and I only ran that three-way comparison retroactively, to convince myself after the fact rather than as I went. The bigger lesson was about scale: on a two-file, 91-line diff, I still hit an import mixup, an 18,195-line red herring from a linter, and a wrong-but-plausible fix that only a third test case would have caught. A project the size of PyTorch doesn't get safer to contribute to because the piece you're touching is small — it gets safer because the tooling and the review process are built to catch exactly the mistakes an outside contributor is likely to make.",
      },
    ],
  },
];
