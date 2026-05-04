import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../utils/api";
import { useToast } from "../components/ToastProvider";
import { FaTrash, FaUpload, FaSave, FaTimes } from "react-icons/fa";
import GoogleLocationInput from "../components/GoogleLocationInput";
import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";

function Section({ title, children }) {
  return (
    <fieldset className="bg-white border border-slate-200 rounded-xl p-5 md:p-6 shadow-sm">
      <legend className="px-2 text-sm font-bold uppercase tracking-widest text-blue-900">
        {title}
      </legend>
      {children}
    </fieldset>
  );
}

function Label({ children, required }) {
  return (
    <label className="block mb-2 text-sm font-semibold text-slate-700">
      {children} {required && <span className="text-red-500">*</span>}
    </label>
  );
}

function Input({ className = "", ...props }) {
  return (
    <input
      {...props}
      className={`w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-900 focus:ring-2 focus:ring-blue-900/10 disabled:bg-slate-100 disabled:cursor-not-allowed ${className}`}
    />
  );
}

function Select({ className = "", children, ...props }) {
  return (
    <select
      {...props}
      className={`w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-900 focus:ring-2 focus:ring-blue-900/10 disabled:bg-slate-100 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </select>
  );
}

function Textarea({ className = "", ...props }) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-900 focus:ring-2 focus:ring-blue-900/10 disabled:bg-slate-100 disabled:cursor-not-allowed ${className}`}
    />
  );
}

function MultiSelect({ label, items, selected, onChange, required }) {
  return (
    <div>
      <Label required={required}>{label}</Label>

      <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 max-h-52 overflow-y-auto">
        {items && items.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {items.map((item) => (
              <label
                key={item.id}
                className="flex items-center gap-3 cursor-pointer bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 hover:border-blue-900/40 transition"
              >
                <input
                  type="checkbox"
                  checked={selected && selected.includes(item.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      onChange([...(selected || []), item.id]);
                    } else {
                      onChange((selected || []).filter((x) => x !== item.id));
                    }
                  }}
                  className="accent-blue-900"
                />
                <span>{item.name}</span>
              </label>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-sm">No hay elementos disponibles</p>
        )}
      </div>
    </div>
  );
}

function NumericSelect({
  label,
  value,
  onChange,
  required,
  disabled,
  max = 20,
}) {
  const options = Array.from({ length: max + 1 }, (_, i) => i);

  return (
    <div>
      <Label required={required}>{label}</Label>
      <Select
        value={value || ""}
        onChange={(e) =>
          onChange(e.target.value ? parseInt(e.target.value) : null)
        }
        disabled={disabled}
      >
        <option value="">Seleccionar</option>
        {options.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </Select>
    </div>
  );
}

export default function PropertyEdit() {
  const { id } = useParams();
  const nav = useNavigate();
  const toast = useToast();

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(false);

  const [propertyTypes, setPropertyTypes] = useState([]);
  const [operationTypes, setOperationTypes] = useState([]);
  const [marketStatuses, setMarketStatuses] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const [tags, setTags] = useState([]);

  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [images, setImages] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    if (id && id !== "new") {
      api
        .get(`/properties/${id}`)
        .then((r) => {
          const prop = r.data.data;

          if (prop.images && Array.isArray(prop.images)) {
            prop.images = prop.images.map((img) => ({
              ...img,
              image_url: normalizeImageUrl(img.image_url),
            }));
          }

          setProperty({
            ...prop,
            state: prop.state || prop.province || "",
          });

          setSelectedAmenities(prop.amenities?.map((a) => a.id) || []);
          setSelectedTags(prop.tags?.map((t) => t.id) || []);
          setImages(prop.images || []);
        })
        .catch((err) => console.error("Error cargando propiedad:", err));
    } else {
      setProperty({
        title: "",
        description: "",
        price: 0,
        currency: "ARS",
        status: "draft",
        is_new: false,
        is_featured: false,
      });

      setSelectedAmenities([]);
      setSelectedTags([]);
      setImages([]);
    }
  }, [id]);

  function normalizeImageUrl(img) {
    if (!img) return img;
    if (img.startsWith("http") || img.startsWith("//")) return img;

    let v = img.replace(/\\/g, "/");
    if (!v.startsWith("/")) v = "/" + v;

    const uploadsBase =
      import.meta.env.VITE_UPLOADS_URL ||
      (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(
        "/index.php",
        "",
      );

    return uploadsBase.replace(/\/$/, "") + v;
  }

  useEffect(() => {
    Promise.all([
      api
        .get("/catalog/property-types")
        .then((r) => setPropertyTypes(r.data.data.property_types || [])),
      api
        .get("/catalog/operation-types")
        .then((r) => setOperationTypes(r.data.data.operation_types || [])),
      api
        .get("/catalog/market-statuses")
        .then((r) => setMarketStatuses(r.data.data.market_statuses || [])),
      api
        .get("/catalog/amenities")
        .then((r) => setAmenities(r.data.data.amenities || [])),
      api.get("/catalog/tags").then((r) => setTags(r.data.data.tags || [])),
    ]).catch((err) => console.error("Error cargando catálogos:", err));
  }, []);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!id || id === "new") {
      const previewUrl = URL.createObjectURL(file);

      const localImg = {
        _localId:
          "local_" + Date.now() + Math.random().toString(36).slice(2, 8),
        isLocal: true,
        file,
        preview_url: previewUrl,
      };

      setImages((prev) => [...(prev || []), localImg]);
      e.target.value = "";
      return;
    }

    const formData = new FormData();
    formData.append("image", file);

    api
      .post(`/properties/${id}/images`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => {
        const newImage = r.data.data || r.data;

        if (newImage && newImage.id) {
          newImage.image_url = normalizeImageUrl(newImage.image_url);
          setImages((prev) => [...(prev || []), newImage]);
          toast.success("Imagen subida correctamente");
        } else {
          console.error("Estructura de imagen inesperada:", newImage);
          toast.error("Error: estructura de respuesta inesperada");
        }

        e.target.value = "";
      })
      .catch((err) => {
        console.error("Error:", err.response || err);
        toast.error(
          "Error al subir imagen: " +
            (err.response?.data?.message || err.message),
        );
      });
  };

  const deleteImage = (img) => {
    if (img.isLocal) {
      setImages((prev) =>
        (prev || []).filter((x) => x._localId !== img._localId),
      );
      if (img.preview_url) URL.revokeObjectURL(img.preview_url);
      toast.info("Imagen local eliminada");
      return;
    }

    setDeleteConfirm({
      img,
      onConfirm: () => {
        api
          .delete(`/properties/${id}/images/${img.id}`)
          .then(() => {
            setImages((prev) => (prev || []).filter((x) => x.id !== img.id));
            toast.success("Imagen eliminada correctamente");
            setDeleteConfirm(null);
          })
          .catch(() => {
            toast.error("Error al eliminar imagen");
            setDeleteConfirm(null);
          });
      },
      onCancel: () => setDeleteConfirm(null),
    });
  };

  const save = async () => {
    try {
      if (!property.title?.trim()) {
        toast.error("El título es obligatorio");
        return;
      }

      if (!property.price || property.price <= 0) {
        toast.error("El precio es obligatorio y debe ser mayor a 0");
        return;
      }

      if (!property.property_type_id) {
        toast.error("El tipo de propiedad es obligatorio");
        return;
      }

      if (!property.operation_type_id) {
        toast.error("El tipo de operación es obligatorio");
        return;
      }

      const payload = {
        ...property,
        province: property.state || property.province,
        amenity_ids: selectedAmenities,
        tag_ids: selectedTags,
      };

      setLoading(true);

      if (id === "new") {
        const res = await api.post("/properties", payload);
        const newId = res.data.data?.id || res.data.id;

        toast.success("Propiedad creada correctamente");

        const localImages = (images || []).filter((i) => i && i.isLocal);

        if (localImages.length > 0 && newId) {
          try {
            await Promise.all(
              localImages.map((li) => {
                const fd = new FormData();
                fd.append("image", li.file);

                return api
                  .post(`/properties/${newId}/images`, fd, {
                    headers: { "Content-Type": "multipart/form-data" },
                  })
                  .then((r) => {
                    const uploaded = r.data.data || r.data;
                    if (uploaded && uploaded.id)
                      uploaded.image_url = normalizeImageUrl(
                        uploaded.image_url,
                      );

                    setImages((prev) => {
                      const others = (prev || []).filter(
                        (x) => x._localId !== li._localId,
                      );
                      return [...others, uploaded];
                    });
                  });
              }),
            );

            toast.success("Imágenes subidas correctamente");
          } catch (e) {
            console.error("Error subiendo imágenes locales:", e);
            toast.error("Error subiendo algunas imágenes");
          }
        }

        setTimeout(() => nav("/admin/properties"), 1500);
      } else {
        await api.put(`/properties/${id}`, payload);
        toast.success("Propiedad guardada correctamente");
        setTimeout(() => nav("/admin/properties"), 1500);
      }
    } catch (e) {
      toast.error(
        "Error al guardar: " + (e.response?.data?.message || e.message),
      );
    } finally {
      setLoading(false);
    }
  };

  if (!property) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-slate-500 shadow-sm">
        Cargando...
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 text-slate-900">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <span className="text-blue-900 tracking-[0.25em] text-xs uppercase block mb-3">
            Gestión inmobiliaria
          </span>

          <h1 className="text-3xl md:text-4xl font-bold text-slate-950 mb-2">
            {id === "new" ? "Nueva propiedad" : "Editar propiedad"}
          </h1>

          <p className="text-slate-600">
            Cargá la información comercial, ubicación, características e
            imágenes de la propiedad.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => nav("/admin/properties")}
            className="h-11 px-5 border border-slate-200 text-slate-600 rounded-md text-sm font-semibold hover:border-blue-900 hover:text-blue-900 transition"
          >
            Cancelar
          </button>

          <button
            onClick={save}
            disabled={loading}
            className="h-11 px-5 inline-flex items-center gap-2 bg-blue-900 text-white rounded-md text-sm font-semibold hover:bg-blue-950 disabled:opacity-50 transition"
          >
            <FaSave />
            {loading ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>

      <Section title="Datos básicos">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <Label required>Título</Label>
            <Input
              value={property.title || ""}
              onChange={(e) =>
                setProperty({ ...property, title: e.target.value })
              }
              placeholder="Ej: Departamento 2 amb en Belgrano"
            />
          </div>

          <div>
            <Label>Descripción</Label>
            <Textarea
              value={property.description || ""}
              onChange={(e) =>
                setProperty({ ...property, description: e.target.value })
              }
              rows="3"
            />
          </div>
        </div>
      </Section>

      <Section title="Precio y expensas">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          <div>
            <Label required>Precio</Label>
            <Input
              type="number"
              inputMode="decimal"
              value={property.price || ""}
              onChange={(e) =>
                setProperty({ ...property, price: e.target.value })
              }
              step="0.01"
              min="0"
            />
          </div>

          <div>
            <Label>Moneda</Label>
            <Select
              value={property.currency || "ARS"}
              onChange={(e) =>
                setProperty({ ...property, currency: e.target.value })
              }
            >
              <option value="ARS">ARS</option>
              <option value="USD">USD</option>
            </Select>
          </div>

          <div>
            <Label>Expensas</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                inputMode="decimal"
                value={property.expenses_amount || ""}
                onChange={(e) =>
                  setProperty({ ...property, expenses_amount: e.target.value })
                }
                step="0.01"
                min="0"
                placeholder="Monto"
                className="flex-1"
              />

              <Select
                value={property.expenses_currency || "ARS"}
                onChange={(e) =>
                  setProperty({
                    ...property,
                    expenses_currency: e.target.value,
                  })
                }
                className="w-24"
              >
                <option value="ARS">ARS</option>
                <option value="USD">USD</option>
              </Select>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Ubicación">
        <div className="space-y-4">
          <GoogleLocationInput
            value={property.full_address || ""}
            onChange={(val) =>
              setProperty((prev) => ({ ...prev, full_address: val }))
            }
            onSelect={(loc) => {
              setProperty((prev) => ({
                ...prev,
                full_address: loc.query || "",
                street: loc.street || "",
                street_number: loc.street_number || "",
                city: loc.city || "",
                state: loc.state || "",
                province: loc.state || "",
                country: loc.country || "",
                neighborhood: loc.neighborhood || "",
                latitude: loc.lat,
                longitude: loc.lng,
              }));
            }}
            placeholder="Buscar dirección"
            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-900 focus:ring-2 focus:ring-blue-900/10"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="Calle"
              value={property.street || ""}
              onChange={(e) =>
                setProperty({ ...property, street: e.target.value })
              }
            />
            <Input
              placeholder="Altura"
              value={property.street_number || ""}
              onChange={(e) =>
                setProperty({ ...property, street_number: e.target.value })
              }
            />
            <Input
              placeholder="Ciudad"
              value={property.city || ""}
              onChange={(e) =>
                setProperty({ ...property, city: e.target.value })
              }
            />
            <Input
              placeholder="Provincia"
              value={property.state || ""}
              onChange={(e) =>
                setProperty({ ...property, state: e.target.value })
              }
            />
            <Input
              placeholder="País"
              value={property.country || ""}
              onChange={(e) =>
                setProperty({ ...property, country: e.target.value })
              }
            />
            <Input
              placeholder="Barrio"
              value={property.neighborhood || ""}
              onChange={(e) =>
                setProperty({ ...property, neighborhood: e.target.value })
              }
            />
          </div>

          {property.latitude && property.longitude && (
            <MapPreview lat={property.latitude} lng={property.longitude} />
          )}
        </div>
      </Section>

      <Section title="Piso y departamento">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <Label>Piso</Label>
            <Input
              value={property.floor || ""}
              onChange={(e) =>
                setProperty({ ...property, floor: e.target.value })
              }
            />
          </div>

          <div>
            <Label>Departamento</Label>
            <Input
              value={property.apartment || ""}
              onChange={(e) =>
                setProperty({ ...property, apartment: e.target.value })
              }
            />
          </div>
        </div>
      </Section>

      <Section title="Características físicas">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
          <NumericSelect
            max={6}
            label="Dormitorios"
            value={property.bedrooms}
            onChange={(v) => setProperty({ ...property, bedrooms: v })}
          />
          <NumericSelect
            max={6}
            label="Ambientes"
            value={property.rooms}
            onChange={(v) => setProperty({ ...property, rooms: v })}
          />
          <NumericSelect
            max={6}
            label="Baños"
            value={property.bathrooms}
            onChange={(v) => setProperty({ ...property, bathrooms: v })}
          />
          <NumericSelect
            label="Cocheras"
            value={property.garages}
            onChange={(v) => setProperty({ ...property, garages: v })}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-5">
          <div>
            <Label>Superficie Total (m²)</Label>
            <Input
              type="number"
              inputMode="decimal"
              value={property.surface_total || ""}
              onChange={(e) =>
                setProperty({ ...property, surface_total: e.target.value })
              }
              step="0.01"
              min="0"
            />
          </div>

          <div>
            <Label>Superficie Cubierta (m²)</Label>
            <Input
              type="number"
              inputMode="decimal"
              value={property.surface_covered || ""}
              onChange={(e) =>
                setProperty({ ...property, surface_covered: e.target.value })
              }
              step="0.01"
              min="0"
            />
          </div>

          <div>
            <Label>Superficie Semi-Cubierta (m²)</Label>
            <Input
              type="number"
              inputMode="decimal"
              value={property.surface_semi_covered || ""}
              onChange={(e) =>
                setProperty({
                  ...property,
                  surface_semi_covered: e.target.value,
                })
              }
              step="0.01"
              min="0"
            />
          </div>

          <div>
            <Label>Superficie Descubierta (m²)</Label>
            <Input
              type="number"
              inputMode="decimal"
              value={property.surface_uncovered || ""}
              onChange={(e) =>
                setProperty({ ...property, surface_uncovered: e.target.value })
              }
              step="0.01"
              min="0"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 mt-5">
          <NumericSelect
            label="Pisos"
            value={property.total_floors}
            onChange={(v) => setProperty({ ...property, total_floors: v })}
          />

          <div>
            <Label>¿Es nuevo?</Label>
            <Select
              value={property.is_new ? "1" : "0"}
              onChange={(e) =>
                setProperty({ ...property, is_new: e.target.value === "1" })
              }
            >
              <option value="0">No</option>
              <option value="1">Sí</option>
            </Select>
          </div>

          <div>
            <Label>Antigüedad (años)</Label>
            <Input
              type="number"
              inputMode="numeric"
              value={property.antiquity_years || ""}
              onChange={(e) =>
                setProperty({ ...property, antiquity_years: e.target.value })
              }
              disabled={property.is_new}
              min="0"
            />
          </div>
        </div>
      </Section>

      <Section title="Tipo y estado">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <Label required>Tipo de propiedad</Label>
            <Select
              value={property.property_type_id || ""}
              onChange={(e) =>
                setProperty({ ...property, property_type_id: e.target.value })
              }
            >
              <option value="">Seleccionar</option>
              {propertyTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label required>Tipo de operación</Label>
            <Select
              value={property.operation_type_id || ""}
              onChange={(e) =>
                setProperty({ ...property, operation_type_id: e.target.value })
              }
            >
              <option value="">Seleccionar</option>
              {operationTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label>Estado de publicación</Label>
            <Select
              value={property.status || "draft"}
              onChange={(e) =>
                setProperty({ ...property, status: e.target.value })
              }
            >
              <option value="draft">Borrador</option>
              <option value="published">Publicado</option>
              <option value="paused">En pausa</option>
            </Select>
          </div>
        </div>

        <div className="mt-5">
          <Label>Estado de la propiedad</Label>
          <Select
            value={property.market_status_id || ""}
            onChange={(e) =>
              setProperty({ ...property, market_status_id: e.target.value })
            }
          >
            <option value="">Seleccionar</option>
            {marketStatuses.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </div>
      </Section>

      <Section title="Características especiales">
        <label className="inline-flex items-center gap-3 text-sm font-semibold text-slate-700">
          <input
            type="checkbox"
            checked={property.is_featured || false}
            onChange={(e) =>
              setProperty({ ...property, is_featured: e.target.checked })
            }
            className="w-4 h-4 accent-blue-900"
          />
          Destacado
        </label>
      </Section>

      <Section title="Amenidades">
        <MultiSelect
          label="Selecciona amenidades"
          items={amenities}
          selected={selectedAmenities}
          onChange={setSelectedAmenities}
        />
      </Section>

      <Section title="Etiquetas">
        <MultiSelect
          label="Selecciona etiquetas"
          items={tags}
          selected={selectedTags}
          onChange={setSelectedTags}
        />
      </Section>

      <Section title="Fotos">
        <div>
          <Label>Agregar foto</Label>

          <label className="inline-flex items-center gap-3 h-11 px-5 bg-blue-900 text-white rounded-md text-sm font-semibold hover:bg-blue-950 cursor-pointer transition">
            <FaUpload />
            Subir imagen
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>

          {id === "new" && (
            <p className="text-slate-500 text-sm mt-3">
              Las imágenes se guardarán después de crear la propiedad.
            </p>
          )}

          {images && images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-5">
              {images.map((img) => (
                <div
                  key={img.id || img._localId}
                  className="relative group border border-slate-200 rounded-xl overflow-hidden bg-slate-100"
                >
                  <img
                    src={
                      img.isLocal
                        ? img.preview_url
                        : normalizeImageUrl(img.image_url)
                    }
                    alt="Propiedad"
                    className="w-full h-40 object-cover"
                  />

                  <button
                    onClick={() => deleteImage(img)}
                    className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1.5 rounded-md text-xs opacity-0 group-hover:opacity-100 transition"
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Section>

      <Section title="Videos">
        <div>
          <Label>URL del video</Label>
          <Input
            type="url"
            value={property.video_url || ""}
            onChange={(e) =>
              setProperty({ ...property, video_url: e.target.value })
            }
            placeholder="https://youtube.com/watch?v=..."
          />

          {property.video_url && (
            <p className="text-sm text-slate-500 mt-2">
              Soporta videos de YouTube, Vimeo y enlaces directos.
            </p>
          )}
        </div>
      </Section>

      <Section title="Notas privadas">
        <Textarea
          value={property.private_notes || ""}
          onChange={(e) =>
            setProperty({ ...property, private_notes: e.target.value })
          }
          rows="3"
          placeholder="Notas solo visibles para administradores"
        />
      </Section>

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          onClick={save}
          disabled={loading}
          className="h-12 px-6 inline-flex items-center justify-center gap-2 bg-blue-900 text-white rounded-md text-sm font-semibold hover:bg-blue-950 disabled:opacity-50 transition"
        >
          <FaSave />
          {loading ? "Guardando..." : "Guardar"}
        </button>

        <button
          onClick={() => nav("/admin/properties")}
          className="h-12 px-6 inline-flex items-center justify-center gap-2 border border-slate-200 text-slate-600 rounded-md text-sm font-semibold hover:border-blue-900 hover:text-blue-900 transition"
        >
          <FaTimes />
          Cancelar
        </button>
      </div>

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white p-6 rounded-xl shadow-xl max-w-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-950 mb-3">
              Confirmar eliminación
            </h3>

            <p className="text-slate-600 mb-6">
              ¿Estás seguro de que deseas eliminar esta imagen?
            </p>

            <div className="flex gap-3 justify-end">
              <button
                onClick={deleteConfirm.onCancel}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-md hover:border-blue-900 hover:text-blue-900 transition"
              >
                Cancelar
              </button>

              <button
                onClick={deleteConfirm.onConfirm}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition inline-flex items-center gap-2"
              >
                <FaTrash />
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MapPreview({ lat, lng }) {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  if (!isLoaded) return null;

  return (
    <div className="w-full h-64 rounded-xl overflow-hidden border border-slate-200">
      <GoogleMap
        center={{ lat, lng }}
        zoom={15}
        mapContainerStyle={{ width: "100%", height: "100%" }}
        options={{
          disableDefaultUI: true,
          zoomControl: true,
        }}
      >
        <Marker position={{ lat, lng }} />
      </GoogleMap>
    </div>
  );
}
