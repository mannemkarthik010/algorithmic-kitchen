/* ─── Open Source Contributions ────────────────────────────────
   Content-block schema so future contributions can be added as pure
   data without touching component code.
   Statuses here mirror the real state of each PR on GitHub — update
   `prStatus` / `statusLabel` when they change. */

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
  prStatus: "open" | "merged" | "closed";
  statusLabel: string;
  issueNumber: number;
  issueUrl: string;
  diffStat: string;
  tags: string[];
  body: ContentBlock[];
}

export const contributions: Contribution[] = [
  /* ── 1. pandera — merged ─────────────────────────────────── */
  {
    slug: "pandera-itemsize-dtypes",
    repo: "unionai-oss/pandera",
    repoUrl: "https://github.com/unionai-oss/pandera",
    stars: "4.4k",
    language: "Python",
    title: "Supporting sized numpy dtypes (S16, U16) in pandera's pandas engine",
    excerpt:
      "Declaring a column as np.dtype(\"S16\") raised a TypeError naming a dtype the user never wrote. A guarded fallback fixed it without regressing the platform-alias normalization the code exists for.",
    prNumber: 2437,
    prUrl: "https://github.com/unionai-oss/pandera/pull/2437",
    prStatus: "merged",
    statusLabel: "Merged",
    issueNumber: 1270,
    issueUrl: "https://github.com/unionai-oss/pandera/issues/1270",
    diffStat: "2 files · +58 / −1",
    tags: ["Python", "NumPy", "pandas", "Testing", "Open Source"],
    body: [
      {
        type: "p",
        text: "pandera is a statistical data-testing library for pandas and friends — roughly 4,400 GitHub stars. My pull request there, #2437, fixes a confusing crash: declaring a column with a sized numpy dtype raised a TypeError that named a dtype the user never wrote. It was reviewed and approved by a maintainer and merged.",
      },
      { type: "h", text: "The bug" },
      {
        type: "code",
        lang: "python",
        code: `pa.DataFrameSchema({"a": pa.Column(np.dtype("S16"))})
# TypeError: data type 'bytes128' not understood`,
      },
      {
        type: "p",
        text: "Nobody typed “bytes128”. The issue reports this for bytes; it affects sized unicode (U16) in exactly the same way.",
      },
      { type: "h", text: "Root cause" },
      {
        type: "p",
        text: "Engine.dtype normalizes platform-specific aliases by round-tripping a numpy dtype through its name, so that np.intc becomes np.int32. That works for fixed-width numeric dtypes, whose name is itself a valid dtype string. It breaks for itemsize-parameterized dtypes: np.dtype(\"S16\").name is \"bytes128\" and np.dtype(\"U16\").name is \"str512\" — neither parses back into a dtype.",
      },
      { type: "h", text: "The fix" },
      {
        type: "p",
        text: "Fall back to the dtype itself when its name doesn't round-trip. The scalar type of a sized dtype is already platform-agnostic, so the subsequent .type lookup resolves it the same way it resolves the unsized spelling.",
      },
      {
        type: "code",
        lang: "python",
        code: `if isinstance(np_or_pd_dtype, np.dtype):
    # cast alias to platform-agnostic dtype
    # e.g.: np.intc -> np.int32
    try:
        common_np_dtype = np.dtype(np_or_pd_dtype.name)
    except TypeError:
        # Itemsize-parameterized dtypes encode their width in
        # \`\`name\`\` in a form \`\`np.dtype\`\` cannot parse back,
        # e.g. np.dtype("S16").name == "bytes128". Their scalar
        # type is already platform-agnostic, so use it as-is.
        common_np_dtype = np_or_pd_dtype
    np_or_pd_dtype = common_np_dtype.type`,
      },
      {
        type: "p",
        text: "The obvious simpler fix — just use np_or_pd_dtype.type directly and skip the round-trip — is wrong in a quiet way. It silently regresses the normalization this code exists for: np.dtype(\"longlong\").type is np.longlong, not np.int64. So I kept the round-trip and only guarded it.",
      },
      { type: "h", text: "The tests" },
      {
        type: "list",
        items: [
          "test_itemsize_parameterized_numpy_dtype — S16, S1, U16 and U100 resolve to the same type as their unsized scalar (np.bytes_ / np.str_).",
          "test_itemsize_parameterized_numpy_dtype_validates — a schema declared with np.dtype(\"S16\") validates real data end to end, not just resolves.",
          "test_platform_alias_numpy_dtype_still_normalized — intc, uintc, longlong and ulonglong still normalize as before. This one exists to catch the tempting-but-wrong fix.",
        ],
      },
      {
        type: "p",
        text: "One scoping note I put in the PR: void dtypes (V8) remain unsupported by the engine, but now surface pandera's own “not understood by Engine” error instead of a raw numpy parse error.",
      },
      { type: "h", text: "The result" },
      {
        type: "list",
        items: [
          "Two files, +58/−1, a single commit.",
          "Approved by a pandera maintainer and merged.",
          "The part I'd repeat: naming the simpler-but-wrong fix in the PR description and writing a test that guards against it, so the reviewer didn't have to rediscover why the round-trip stays.",
        ],
      },
    ],
  },

  /* ── 2. PyTorch FX codegen — open, approved ───────────────── */
  {
    slug: "pytorch-fx-format-target",
    repo: "pytorch/pytorch",
    repoUrl: "https://github.com/pytorch/pytorch",
    stars: "102k",
    language: "Python",
    title: "Fixing torch.fx codegen for module names that are keywords or need escaping",
    excerpt:
      "torch.fx could generate syntactically invalid Python for module names like `class` or names containing a quote. Approved by a PyTorch reviewer and open for merge.",
    prNumber: 191687,
    prUrl: "https://github.com/pytorch/pytorch/pull/191687",
    prStatus: "open",
    statusLabel: "Open · Approved",
    issueNumber: 188538,
    issueUrl: "https://github.com/pytorch/pytorch/issues/188538",
    diffStat: "2 files · +81 / −3",
    tags: ["Python", "PyTorch", "Code Generation", "Open Source"],
    body: [
      {
        type: "p",
        text: "torch.fx traces a model into a Graph and generates Python source from it. For module names that work fine in eager mode and trace fine through torch.export, that generated source could be invalid Python. PR #191687 fixes that in torch/fx/graph.py. It has been approved by a PyTorch reviewer and is open for merge — I'm keeping that status accurate rather than rounding it up.",
      },
      { type: "h", text: "The bug" },
      {
        type: "p",
        text: "_format_target chose between dot syntax and getattr() using str.isidentifier() alone, and built the getattr() argument by splicing the name into a hand-written double-quoted string. Two failures follow. Keywords such as class pass isidentifier(), so a submodule named class produced self.seq.class(x). And a name containing a double quote produced getattr(self, \"quote\"key\")(x). Backslashes and non-printable characters break the same way.",
      },
      { type: "h", text: "The fix" },
      {
        type: "p",
        text: "Route keywords through getattr() as well, and emit the name through a helper that keeps the double-quoted spelling when it is exactly equivalent, falling back to repr otherwise.",
      },
      {
        type: "code",
        lang: "python",
        code: `def _format_attr_literal(name: str) -> str:
    if '"' not in name and "\\\\" not in name and name.isprintable():
        return f'"{name}"'
    return repr(name)


def _format_target(base: str, target: str) -> str:
    elems = target.split(".")
    r = base
    for e in elems:
        # Keywords satisfy \`\`str.isidentifier()\`\` but cannot be used with dot
        # syntax, so they have to go through \`\`getattr\`\` as well.
        if e.isidentifier() and not keyword.iskeyword(e):
            r = f"{r}.{e}"
        else:
            r = f"getattr({r}, {_format_attr_literal(e)})"
    return r`,
      },
      {
        type: "p",
        text: "Keeping the double-quoted form when it's safe is deliberate. nn.Sequential addresses its children as \"0\", \"1\", … — the most common getattr() case in generated code — so using repr unconditionally would rewrite it as '0' and churn expected output across the test suite for no behavioural gain. Soft keywords (match, case, type) are legal attribute names and stay on the dot path. No currently-passing test changes behaviour: the only inputs whose output differs are the ones that previously generated invalid Python.",
      },
      { type: "h", text: "The tests" },
      {
        type: "list",
        items: [
          "test_format_target_unsafe_names — a direct table of inputs and exact expected output: keywords, dotted keyword paths, None, soft keywords staying on the dot path, quotes, backslashes, newlines, and the unchanged historical spelling for seq.0 and a.b.",
          "test_trace_module_name_is_keyword — traces a real module with a submodule named class, lints the graph, checks the generated code, and asserts the traced module's output equals eager.",
          "test_trace_module_name_needs_escape — the same end-to-end check for a submodule name containing a quote.",
        ],
      },
      { type: "h", text: "Status" },
      {
        type: "list",
        items: [
          "Two files, +81/−3. Fixes issue #188538.",
          "Approved by a PyTorch reviewer; open for merge.",
        ],
      },
    ],
  },

  /* ── 3. PyTorch Flight Recorder — closed, superseded ─────── */
  {
    slug: "pytorch-flight-recorder-gc",
    repo: "pytorch/pytorch",
    repoUrl: "https://github.com/pytorch/pytorch",
    stars: "102k",
    language: "Python",
    title: "Restoring the caller's GC state in PyTorch's Flight Recorder",
    excerpt:
      "My first PyTorch PR: a permanent garbage-collector leak in a distributed debugging tool, and a test suite verified against the wrong fix too. Closed as a duplicate — someone had claimed it first, and I missed the comment.",
    prNumber: 191439,
    prUrl: "https://github.com/pytorch/pytorch/pull/191439",
    prStatus: "closed",
    statusLabel: "Closed · Superseded",
    issueNumber: 191396,
    issueUrl: "https://github.com/pytorch/pytorch/issues/191396",
    diffStat: "2 files · +67 / −24",
    tags: ["Python", "Distributed Systems", "Testing", "Open Source"],
    body: [
      {
        type: "p",
        text: "PyTorch is not a small project to cut your open-source teeth on. It has roughly 102,000 GitHub stars and a commit history past 108,000 commits on main. My first pull request there — #191439 — is small by the numbers: two files changed, 67 lines added, 24 removed. It did not land: it was closed as a duplicate of a PR that fixed the same thing. I'm including it anyway, because the engineering was sound and the way it ended taught me something I use every time now.",
      },
      { type: "h", text: "The project" },
      {
        type: "p",
        text: "pytorch/pytorch is the reference implementation of the deep learning framework most of the industry trains on. My change lived in torch.distributed.flight_recorder — the tool PyTorch's distributed team built to debug multi-GPU training runs after the fact, by loading and analyzing trace dumps collected from every rank in a collective operation (mismatched tensor sizes, a rank that never joined a collective, that kind of failure).",
      },
      { type: "h", text: "The issue" },
      {
        type: "p",
        text: "I didn't discover this bug. PyTorch runs automated code-quality triage that opens real issues against real problems in the codebase. On the day I went looking for something to work on, that triage had filed six issues in a single batch, all labeled “good first issue” under oncall: distributed infra. I picked issue #191396 over the other five because it described an actual correctness bug, not a lint nit, and it shipped with a reproduction script and a stated expected behavior.",
      },
      { type: "h", text: "The bug" },
      {
        type: "p",
        text: "Flight Recorder's read_dir() loads trace dump files from a directory. Trace dumps from a large run can be large and numerous, so read_dir() calls gc.disable() on entry — presumably to avoid GC pauses while unpickling a lot of objects. Nothing in the module ever called gc.enable() again: not on the success path, and not on any of the three ways the function can fail. Call read_dir() once and cyclic garbage collection is off for the rest of the process.",
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
        text: "Any long-lived tool that imports this loader silently stops collecting reference cycles the first time it reads a trace directory. It doesn't crash and it doesn't log anything — it just leaks slowly. I checked, and the bug was present in the shipped torch 2.11.0 release as well as on main.",
      },
      { type: "h", text: "The fix" },
      {
        type: "p",
        text: "Three lines of actual logic: capture gc.isenabled() before disabling, wrap the body in try, restore the captured state in finally. The detail that matters is that the restore is conditional. Calling gc.enable() unconditionally in the finally block is a second bug — it turns collection on even for a caller who had deliberately disabled it. The fix has to restore the caller's exact prior state, not just flip collection back “on.”",
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
        text: "A dedicated test class, FlightRecorderLoaderGCTest, with three cases: GC enabled and a successful read (still enabled afterward), GC enabled and a read that fails because the directory doesn't exist (still enabled afterward), and GC already disabled by the caller (still disabled afterward). setUp records the ambient GC state and restores it via addCleanup, so a failing test can't leak a disabled collector into the rest of the suite.",
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
        text: "A test suite that passes whether or not the bug is fixed proves nothing. So I ran the three tests against three implementations of read_dir() and checked that each failed exactly where it should:",
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
        text: "Tests 1 and 2 fail against the original code — that proves they catch the bug. Test 3 fails against the naive unconditional fix — that proves the suite catches the wrong fix too. Only the real fix passes all three.",
      },
      { type: "h", text: "Working around a multi-hour build" },
      {
        type: "p",
        text: "Building PyTorch from source takes hours and gigabytes — not worth it to validate a pure-Python change to one file. I installed a PyTorch nightly wheel, then at test time loaded my patched loader.py into the installed torch package's namespace in memory and ran the real test_fr_analysis.py against it. The actual test suite ran against my actual patch, with nothing compiled and the installed package untouched on disk.",
      },
      { type: "h", text: "Two false alarms" },
      {
        type: "list",
        items: [
          "My tests initially “failed” because the runner was importing torch from site-packages rather than my patched checkout. The traceback's file paths gave it away.",
          "PyTorch's PYREFLY type checker reported 18,195 errors. Zero were in my files — it can't resolve the compiled torch._C extension in an unbuilt checkout, so every torch.float32-style lookup fails. The lesson was reading a scary failure carefully enough to notice none of it points at your own diff.",
        ],
      },
      { type: "h", text: "How it ended" },
      {
        type: "list",
        items: [
          "I commented on the issue with my intended approach before writing code, signed the Linux Foundation EasyCLA, and added the release-notes label through @pytorchbot (external contributors can't set labels directly).",
          "A PyTorch collaborator reviewed and approved the PR.",
          "The PR was then closed as a duplicate: another contributor had commented their intent on the issue a few hours before mine, and their PR (#191607) landed the same fix. I had missed their comment when I picked the issue up. I said so on the thread, thanked them, and closed mine.",
        ],
      },
      { type: "h", text: "What I'd do differently" },
      {
        type: "p",
        text: "Read the entire issue thread — every comment, not just the top post — before claiming anything. The duplicated work was avoidable, and it's the most concrete thing this PR taught me. The second lesson is the verification table: I'd build it before writing the fix rather than after, because proving a test can fail is more informative than watching it pass. And on a two-file, 91-line diff I still hit an import mixup, an 18,195-line red herring from a linter, and a plausible-but-wrong fix that only a third test would have caught. A project this size isn't safer to contribute to because your piece is small — it's safer because the tooling and review process are built to catch exactly the mistakes an outside contributor is likely to make.",
      },
    ],
  },
];
