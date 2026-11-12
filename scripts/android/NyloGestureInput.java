// Disposable emulator test input only. Never bundled with or loaded by Nylo.
import android.os.SystemClock;
import android.view.InputDevice;
import android.view.InputEvent;
import android.view.MotionEvent;
import java.lang.reflect.Method;

public final class NyloGestureInput {
    public static void main(String[] args) throws Exception {
        if (args.length != 2) throw new IllegalArgumentException("Expected x y");
        int x = Integer.parseInt(args[0]);
        int y = Integer.parseInt(args[1]);
        Class<?> inputClass;
        try {
            inputClass = Class.forName("android.hardware.input.InputManagerGlobal");
        } catch (ClassNotFoundException oldAndroid) {
            inputClass = Class.forName("android.hardware.input.InputManager");
        }
        Object manager = inputClass.getMethod("getInstance").invoke(null);
        Method inject = inputClass.getMethod("injectInputEvent", InputEvent.class, int.class);
        long previousUp = 0;
        long gap = 0;
        for (int tap = 0; tap < 2; tap++) {
            long down = SystemClock.uptimeMillis();
            if (tap == 1) {
                gap = down - previousUp;
                if (gap < 60 || gap >= 350) throw new IllegalStateException("Native tap gap out of bounds");
            }
            send(manager, inject, down, down, MotionEvent.ACTION_DOWN, x, y);
            SystemClock.sleep(40);
            long up = SystemClock.uptimeMillis();
            if (up - down >= 500) throw new IllegalStateException("Native tap became a long press");
            send(manager, inject, down, up, MotionEvent.ACTION_UP, x, y);
            previousUp = up;
            if (tap == 0) SystemClock.sleep(80);
        }
        System.out.println("Native double-tap injected; gapMs=" + gap);
    }

    private static void send(Object manager, Method inject, long down, long at, int action, int x, int y) throws Exception {
        MotionEvent event = MotionEvent.obtain(down, at, action, x, y, 0);
        event.setSource(InputDevice.SOURCE_TOUCHSCREEN);
        try {
            if (!Boolean.TRUE.equals(inject.invoke(manager, event, 2))) {
                throw new IllegalStateException("Native input injection rejected");
            }
        } finally {
            event.recycle();
        }
    }
}
