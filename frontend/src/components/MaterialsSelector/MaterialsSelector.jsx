import PropTypes from 'prop-types';
import './MaterialsSelector.css';

const MaterialsSelector = ({ selectedMaterials, onMaterialsChange }) => {
  const materials = [
    { id: 'plastic', name: 'Plastic', icon: '🥤' },
    { id: 'paper', name: 'Paper', icon: '📄' },
    { id: 'glass', name: 'Glass', icon: '🍶' },
    { id: 'metal', name: 'Metal', icon: '🥫' },
    { id: 'electronics', name: 'Electronics', icon: '💻' },
    { id: 'organic', name: 'Organic', icon: '🍎' }
  ];

  const toggleMaterial = (materialId) => {
    if (selectedMaterials.includes(materialId)) {
      onMaterialsChange(selectedMaterials.filter(id => id !== materialId));
    } else {
      onMaterialsChange([...selectedMaterials, materialId]);
    }
  };

  return (
    <div className="materials-selector">
      <h3>Select Materials</h3>
      <div className="materials-grid">
        {materials.map(material => (
          <button
            key={material.id}
            className={`material-item ${selectedMaterials.includes(material.id) ? 'selected' : ''}`}
            onClick={() => toggleMaterial(material.id)}
            type="button"
          >
            <span className="material-icon">{material.icon}</span>
            <span className="material-name">{material.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

MaterialsSelector.propTypes = {
  selectedMaterials: PropTypes.arrayOf(PropTypes.string).isRequired,
  onMaterialsChange: PropTypes.func.isRequired
};

export default MaterialsSelector;