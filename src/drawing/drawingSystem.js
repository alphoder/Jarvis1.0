import * as THREE from 'three';

class DrawingSystem {
  constructor(scene) {
    this.scene = scene;
    this.strokes = [];        // Completed strokes: { points: Vector3[], line: THREE.Mesh|Line }
    this.currentStroke = null; // Active stroke being drawn
    this.isDrawing = false;
    this.minPointDistance = 0.15; // Min distance between points to avoid over-sampling

    // Live drawing material (thin line while drawing)
    this.lineMaterial = new THREE.LineBasicMaterial({
      color: 0x00aaff,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }

  startStroke(worldPos) {
    this.isDrawing = true;
    const points = [worldPos.clone()];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geometry, this.lineMaterial.clone());
    line.frustumCulled = false;
    this.scene.add(line);
    this.currentStroke = { points, line };
  }

  addPoint(worldPos) {
    if (!this.isDrawing || !this.currentStroke) return;
    const lastPoint = this.currentStroke.points[this.currentStroke.points.length - 1];
    if (worldPos.distanceTo(lastPoint) < this.minPointDistance) return;

    this.currentStroke.points.push(worldPos.clone());
    // Rebuild geometry from points
    this.currentStroke.line.geometry.dispose();
    this.currentStroke.line.geometry = new THREE.BufferGeometry().setFromPoints(
      this.currentStroke.points
    );
  }

  endStroke() {
    if (!this.isDrawing || !this.currentStroke) return;
    this.isDrawing = false;
    if (this.currentStroke.points.length > 1) {
      this._upgradeToTube(this.currentStroke);
      this.strokes.push(this.currentStroke);
    } else {
      // Single point — discard
      this.scene.remove(this.currentStroke.line);
      this.currentStroke.line.geometry.dispose();
      this.currentStroke.line.material.dispose();
    }
    this.currentStroke = null;
  }

  _upgradeToTube(stroke) {
    // Replace thin Line with TubeGeometry mesh for visible thickness + bloom glow
    const curve = new THREE.CatmullRomCurve3(stroke.points);
    const segments = Math.max(stroke.points.length * 2, 4);
    const tubeGeo = new THREE.TubeGeometry(curve, segments, 0.06, 8, false);
    const tubeMat = new THREE.MeshBasicMaterial({
      color: 0x00ccff,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
    tubeMesh.frustumCulled = false;

    // Swap old line for tube
    this.scene.remove(stroke.line);
    stroke.line.geometry.dispose();
    stroke.line.material.dispose();
    stroke.line = tubeMesh;
    this.scene.add(tubeMesh);
  }

  undo() {
    if (this.strokes.length === 0) return;
    const last = this.strokes.pop();
    this.scene.remove(last.line);
    last.line.geometry.dispose();
    if (last.line.material) last.line.material.dispose();
  }

  clear() {
    for (const stroke of this.strokes) {
      this.scene.remove(stroke.line);
      stroke.line.geometry.dispose();
      if (stroke.line.material) stroke.line.material.dispose();
    }
    this.strokes = [];
    if (this.currentStroke) {
      this.scene.remove(this.currentStroke.line);
      this.currentStroke.line.geometry.dispose();
      if (this.currentStroke.line.material) this.currentStroke.line.material.dispose();
      this.currentStroke = null;
      this.isDrawing = false;
    }
  }

  getStrokeCount() {
    return this.strokes.length;
  }
}

export default DrawingSystem;
