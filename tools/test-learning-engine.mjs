import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { CourseLoader } from '../frontend/learn-v2/engine/CourseLoader.js';
import { evaluateJavaChallenge } from '../frontend/learn-v2/engine/CodeValidator.js';
import { GameEngine } from '../frontend/learn-v2/engine/GameEngine.js';
import { ProgressStore } from '../frontend/learn-v2/engine/ProgressStore.js';
import { ReviewScheduler } from '../frontend/learn-v2/engine/ReviewScheduler.js';

const course = JSON.parse(await readFile(
  new URL('../frontend/learn-v2/data/oop-java-migrated.json', import.meta.url),
  'utf8'
));

assert.equal(CourseLoader.validate(course), true);

const sourceBlocks = course.topics.flatMap(topic => topic.blocks);
const sequence = CourseLoader.sequence(course, { interactionFirst: true });
assert.equal(sequence.length, sourceBlocks.length);
assert.equal(new Set(sequence.map(block => block.id)).size, sourceBlocks.length);
assert.equal(sequence[0].type, 'code');
assert.equal(sequence[0].id, 'section-1-code');

const codeBlocks = sourceBlocks.filter(block => block.type === 'code');
assert.equal(codeBlocks.length, 5);
for (const block of codeBlocks) {
  const starterResult = evaluateJavaChallenge(block, block.starter);
  assert.equal(starterResult.pass, false, `${block.id} starter should require learner work`);
  assert.ok(starterResult.checks.some(check => !check.passed), `${block.id} should expose a useful failed check`);
}

const passingSolutions = {
  'section-1-code': `public class PaymentProcessor {
    private String processorId;
    public void processPayment(double amount) {}
}
class PaymentDemo {
    public static void main(String[] args) {
        PaymentProcessor processor = new PaymentProcessor();
        processor.processPayment(100.00);
    }
}`,
  'section-2-code': `public class User {
    private String name;
    private String email;
    private double accountBalance;
    public void updateProfile(String newName, String newEmail) {
        this.name = newName;
        this.email = newEmail;
    }
    public double checkBalance() { return accountBalance; }
}`,
  'section-3-code': `public class User {
    private String name;
    private String email;
    private double accountBalance;
    public User(String name, String email, double initialBalance) {
        this.name = name;
        this.email = email;
        this.accountBalance = initialBalance;
    }
    public User(String name, String email) {
        this(name, email, 0.0);
    }
}`,
  'section-4-code': `class User {
    public boolean makePayment(double amount) { return amount > 0; }
    public void receivePayment(double amount) {}
}
public class TransactionSystem {
    public static boolean transferMoney(User sender, User receiver, double amount) {
        if (sender.makePayment(amount)) {
            receiver.receivePayment(amount);
            return true;
        }
        return false;
    }
}`,
  'section-5-code': `public class User {
    private String name;
    private double accountBalance;
    public User(String name, double initialBalance) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Name is required");
        }
        if (initialBalance < 0) {
            throw new IllegalArgumentException("Balance cannot be negative");
        }
        this.name = name;
        this.accountBalance = initialBalance;
    }
}`
};

for (const block of codeBlocks) {
  const passingResult = evaluateJavaChallenge(block, passingSolutions[block.id]);
  assert.equal(passingResult.pass, true, `${block.id} reference solution should pass`);
}

const malformed = evaluateJavaChallenge(codeBlocks[0], 'public class PaymentProcessor {');
assert.equal(malformed.pass, false);
assert.ok(malformed.diagnostics.some(message => message.includes('unclosed brace')));
const oversized = evaluateJavaChallenge(codeBlocks[0], 'x'.repeat(12001));
assert.equal(oversized.pass, false);
assert.ok(oversized.diagnostics.some(message => message.includes('12,000 characters')));

const storedValues = new Map();
globalThis.localStorage = {
  getItem(key) { return storedValues.get(key) ?? null; },
  setItem(key, value) { storedValues.set(key, value); }
};
storedValues.set('lbs2:corrupt-course', JSON.stringify({
  completed: 'not-an-array',
  position: -8,
  game: [],
  reviews: []
}));
const recoveredProgress = new ProgressStore('corrupt-course');
assert.deepEqual(recoveredProgress.get(), {
  completed: [],
  position: 0,
  game: {},
  reviews: {}
});
recoveredProgress.complete('block-1');
assert.equal(recoveredProgress.save({ position: 1 }), true);

const game = new GameEngine({ xp: -30, streak: 'many', freezes: -1, badges: 'badge' });
assert.equal(game.xp, 0);
assert.equal(game.streak, 0);
assert.equal(game.freezes, 2);
game.award(Number.NaN);
assert.equal(game.xp, 0);

const reviews = new ReviewScheduler([]);
assert.deepEqual(reviews.due(), []);
assert.equal(reviews.grade('', 3), null);
assert.equal(reviews.grade('objects', 99).interval, 1);

console.log(`Learning engine QA passed: ${sequence.length} blocks, ${codeBlocks.length} code challenges, corrupted-state recovery.`);
