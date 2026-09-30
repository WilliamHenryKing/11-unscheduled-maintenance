import * as THREE from "three";

type Resource = THREE.BufferGeometry | THREE.Material | THREE.Texture;

// Module caches are borrowed by every level. Replacing a bench must keep them alive.
const sharedResources = new Set<Resource>();
export function shared<T extends Resource>(resource: T): T {
  sharedResources.add(resource);
  return resource;
}

/** Release owned resources once, or include module caches when the entire stage closes. */
export function disposeTree(root: THREE.Object3D, includeShared = false) {
  const resources = new Set<Resource>();
  root.traverse((object) => {
    if (object instanceof THREE.InstancedMesh) object.dispose();
    if (
      object instanceof THREE.DirectionalLight ||
      object instanceof THREE.PointLight ||
      object instanceof THREE.SpotLight
    )
      object.shadow.dispose();
    if (
      object instanceof THREE.Mesh ||
      object instanceof THREE.Line ||
      object instanceof THREE.Points ||
      object instanceof THREE.Sprite
    ) {
      // Sprites borrow one Three.js geometry; keep it across levels, release it with the stage.
      if (includeShared || !(object instanceof THREE.Sprite)) resources.add(object.geometry);
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of materials) {
        resources.add(material);
        for (const value of Object.values(material)) {
          if (value instanceof THREE.Texture) resources.add(value);
        }
      }
    }
  });
  if (includeShared) for (const resource of sharedResources) resources.add(resource);
  for (const resource of resources) {
    if (includeShared || !sharedResources.has(resource)) resource.dispose();
  }
  root.clear();
}
