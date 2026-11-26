import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';
const REQ_PATH = __ENV.REQ_PATH || '/health';
const TARGET = __ENV.TARGET || 'health';
const VUS = Number(__ENV.VUS || 100);
const RAMP_UP = __ENV.RAMP_UP || '30s';
const HOLD = __ENV.HOLD || '2m';
const RAMP_DOWN = __ENV.RAMP_DOWN || '30s';
const SLEEP = Number(__ENV.SLEEP || 1);
const UNIQUE_IPS = __ENV.UNIQUE_IPS === '1';
const LOAD_TEST_BYPASS_KEY = __ENV.LOAD_TEST_BYPASS_KEY;

export const options = {
    scenarios: {
        load: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: RAMP_UP, target: VUS },
                { duration: HOLD, target: VUS },
                { duration: RAMP_DOWN, target: 0 },
            ],
            gracefulRampDown: '10s',
        },
    },
    thresholds: {
        http_req_duration: ['p(95)<500', 'p(99)<1000'],
        http_req_failed: ['rate<0.01'],
        checks: ['rate>0.99'],
    },
};

function headers() {
    const base = { Accept: 'application/json' };
    if (LOAD_TEST_BYPASS_KEY) {
        base['x-load-test-key'] = LOAD_TEST_BYPASS_KEY;
    }
    if (!UNIQUE_IPS) return base;

    const n = Math.max(__VU, 1);
    const a = 10 + (Math.floor(n / 65536) % 246);
    const b = Math.floor(n / 256) % 256;
    const c = n % 256;
    return { ...base, 'X-Forwarded-For': `${a}.${b}.${c}.1` };
}

export default function () {
    let res;

    if (TARGET === 'auth') {
        res = http.post(
            `${BASE_URL}/api/v1/auth/sign-in`,
            JSON.stringify({
                email: __ENV.EMAIL,
                password: __ENV.PASSWORD,
            }),
            {
                headers: {
                    'Content-Type': 'application/json',
                    ...headers(),
                },
            }
        );
    } else {
        res = http.get(`${BASE_URL}${REQ_PATH}`, { headers: headers() });
    }

    check(res, {
        'status is 2xx': (r) => r.status >= 200 && r.status < 300,
        'not rate limited': (r) => r.status !== 429,
    });

    sleep(SLEEP);
}
