import getAnglesBetween from './angles';

test('test angle calculations', () => {
    const nose = [341.18, 205.03]
    const leftEye = [382.32, 175.56]
    const rightEye = [295.13, 177.64]

    const [noseToLeftEyeAngle, noseToRightEyeAngle] =
        getAnglesBetween(nose, leftEye, rightEye)

    expect(noseToLeftEyeAngle).toBe(35.61533035259537)
    expect(noseToRightEyeAngle).toBe(30.743685482520558)
});
