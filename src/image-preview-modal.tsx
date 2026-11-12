import React, { useMemo, useRef, useState } from "react";
import {
  Animated,
  GestureResponderEvent,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { Attachment } from "./types";
import { attachmentUri } from "./attachments";
import { shareGeneratedFile } from "./file-export";
import { Text } from "./typography";
import { Icon } from "./ui";
import {
  constrainImagePose,
  fitImage,
  ImagePose,
  ImageTap,
  isImageTap,
  isImageDoubleTap,
  initialImagePose,
  Point,
  Size,
  transformImagePose,
} from "./image-view-geometry";

type Gesture = {
  startedAt: number;
  points: Point[];
  pose: ImagePose;
  moved: boolean;
  multiple: boolean;
  last: Point;
};
const midpoint = (points: Point[]) => ({
  x: (points[0].x + points[1].x) / 2,
  y: (points[0].y + points[1].y) / 2,
});
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

export function ImagePreviewModal({
  file,
  onClose,
  onError,
}: {
  file: Attachment;
  onClose: () => void;
  onError: (error: unknown) => void;
}) {
  const canvas = useRef<React.ComponentRef<typeof View>>(null);
  const origin = useRef({ x: 0, y: 0 });
  const view = useRef<Size>({ width: 0, height: 0 });
  const [viewport, setViewport] = useState(view.current);
  const [natural, setNatural] = useState<Size>({ width: 1, height: 1 });
  const fitted = fitImage(viewport, natural);
  const dimensions = useRef(fitted);
  dimensions.current = fitted;
  const pose = useRef<ImagePose>({ ...initialImagePose });
  const gesture = useRef<Gesture | null>(null);
  const lastTap = useRef<ImageTap | null>(null);
  const [zoom, setZoom] = useState(100);
  const [loadFailed, setLoadFailed] = useState(false);
  const values = useRef({
    scale: new Animated.Value(1),
    x: new Animated.Value(0),
    y: new Animated.Value(0),
  }).current;
  const source = useMemo(() => ({ uri: attachmentUri(file) }), [file]);

  function apply(next: ImagePose, announce = false) {
    const result = constrainImagePose(next, view.current, dimensions.current);
    pose.current = result;
    values.scale.setValue(result.scale);
    values.x.setValue(result.x);
    values.y.setValue(result.y);
    if (announce) setZoom(Math.round(result.scale * 100));
  }
  function zoomTo(scale: number, point: Point = { x: 0, y: 0 }) {
    lastTap.current = null;
    apply(
      transformImagePose(
        pose.current,
        point,
        point,
        scale,
        view.current,
        dimensions.current,
      ),
      true,
    );
  }
  function points(event: GestureResponderEvent): Point[] {
    return event.nativeEvent.touches.slice(0, 2).map((touch) => ({
      x: touch.pageX - origin.current.x - view.current.width / 2,
      y: touch.pageY - origin.current.y - view.current.height / 2,
    }));
  }
  function begin(event: GestureResponderEvent, rebase = false) {
    const touches = points(event);
    if (!touches.length) return;
    const previous = gesture.current;
    gesture.current = {
      startedAt: rebase && previous ? previous.startedAt : Date.now(),
      points: touches,
      pose: { ...pose.current },
      moved: rebase ? previous?.moved || false : false,
      multiple: rebase || touches.length > 1,
      last: touches[0],
    };
  }
  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => begin(event),
        onPanResponderStart: (event) => {
          if (points(event).length !== gesture.current?.points.length)
            begin(event, true);
        },
        onPanResponderMove: (event) => {
          const current = gesture.current;
          const touches = points(event);
          if (!current || !touches.length) return;
          if (touches.length !== current.points.length) {
            begin(event, true);
            return;
          }
          current.last = touches[0];
          current.moved ||= distance(touches[0], current.points[0]) > 8;
          if (touches.length === 2) {
            current.multiple = true;
            const originalDistance = distance(
              current.points[0],
              current.points[1],
            );
            if (originalDistance < 1) return;
            apply(
              transformImagePose(
                current.pose,
                midpoint(current.points),
                midpoint(touches),
                (current.pose.scale * distance(touches[0], touches[1])) /
                  originalDistance,
                view.current,
                dimensions.current,
              ),
            );
          } else {
            apply({
              scale: current.pose.scale,
              x: current.pose.x + touches[0].x - current.points[0].x,
              y: current.pose.y + touches[0].y - current.points[0].y,
            });
          }
        },
        onPanResponderEnd: (event) => {
          if (event.nativeEvent.touches.length) begin(event, true);
        },
        onPanResponderRelease: () => {
          const current = gesture.current;
          gesture.current = null;
          setZoom(Math.round(pose.current.scale * 100));
          if (!current || current.moved || current.multiple) {
            lastTap.current = null;
            return;
          }
          const tap: ImageTap = {
            startedAt: current.startedAt,
            endedAt: Date.now(),
            point: current.last,
          };
          if (!isImageTap(tap)) {
            lastTap.current = null;
            return;
          }
          if (isImageDoubleTap(lastTap.current, tap)) {
            zoomTo(pose.current.scale > 1 ? 1 : 2.5, current.last);
          } else lastTap.current = tap;
        },
        onPanResponderTerminationRequest: () => false,
        onPanResponderTerminate: () => {
          gesture.current = null;
          lastTap.current = null;
          setZoom(Math.round(pose.current.scale * 100));
        },
      }),
    [],
  );

  return (
    <Modal
      visible
      animationType="fade"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.screen}>
        <StatusBar style="light" />
        <View style={styles.toolbar}>
          <Text numberOfLines={1} style={styles.filename}>
            {file.name}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close image preview"
            onPress={onClose}
            style={styles.control}
          >
            <Icon name="close" size={24} color="#FFFFFF" />
          </Pressable>
        </View>
        <View
          ref={canvas}
          collapsable={false}
          style={styles.canvas}
          accessible
          accessibilityRole="image"
          accessibilityLabel={`Image preview: ${file.name}`}
          accessibilityHint="Use the zoom and reset controls below the image."
          accessibilityActions={[
            { name: "increment", label: "Zoom in" },
            { name: "decrement", label: "Zoom out" },
            { name: "activate", label: "Reset image zoom" },
          ]}
          onAccessibilityAction={({ nativeEvent }) => {
            zoomTo(
              nativeEvent.actionName === "activate"
                ? 1
                : pose.current.scale *
                    (nativeEvent.actionName === "increment" ? 1.5 : 1 / 1.5),
            );
          }}
          onLayout={({ nativeEvent }) => {
            const next = nativeEvent.layout;
            if (
              next.width !== view.current.width ||
              next.height !== view.current.height
            ) {
              view.current = { width: next.width, height: next.height };
              setViewport(view.current);
              gesture.current = null;
              lastTap.current = null;
              apply({ ...initialImagePose }, true);
            }
            canvas.current?.measureInWindow((x, y) => {
              origin.current = { x, y };
            });
          }}
          {...responder.panHandlers}
        >
          {loadFailed ? (
            <Text style={styles.hint}>Could not open this image.</Text>
          ) : (
            <Animated.Image
              source={source}
              resizeMode="contain"
              accessible={false}
              onLoad={({ nativeEvent }) => {
                const { width, height } = nativeEvent.source;
                if (width > 0 && height > 0) setNatural({ width, height });
              }}
              onError={() => setLoadFailed(true)}
              style={{
                position: "absolute",
                width: fitted.width,
                height: fitted.height,
                left: (viewport.width - fitted.width) / 2,
                top: (viewport.height - fitted.height) / 2,
                transform: [
                  { translateX: values.x },
                  { translateY: values.y },
                  { scale: values.scale },
                ],
              }}
            />
          )}
        </View>
        <View style={styles.footer}>
          <Text style={styles.hint}>Pinch or double-tap to zoom</Text>
          <View style={styles.toolbar}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Zoom out"
              onPress={() => zoomTo(pose.current.scale / 1.5)}
              style={styles.control}
            >
              <Icon name="remove" size={22} color="#FFFFFF" />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Image zoom ${zoom} percent`}
              accessibilityHint="Reset image zoom"
              onPress={() => zoomTo(1)}
              style={styles.control}
            >
              <Text style={styles.label}>{zoom}%</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Zoom in"
              onPress={() => zoomTo(pose.current.scale * 1.5)}
              style={styles.control}
            >
              <Icon name="add" size={22} color="#FFFFFF" />
            </Pressable>
            <View style={{ flex: 1 }} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Save or share"
              onPress={() => void shareGeneratedFile(file).catch(onError)}
              style={[styles.control, styles.share]}
            >
              <Icon name="share-outline" size={21} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0B0D12" },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  filename: { flex: 1, color: "#FFFFFF", fontSize: 14 },
  canvas: { flex: 1, overflow: "hidden", justifyContent: "center" },
  footer: { paddingTop: 10, paddingBottom: 6 },
  hint: { color: "#B8BEC9", fontSize: 12, textAlign: "center" },
  control: {
    minWidth: 48,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  share: { flexDirection: "row", gap: 8, paddingHorizontal: 8 },
  label: { color: "#FFFFFF", fontSize: 14 },
});
