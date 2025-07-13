import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { HeaderComponent } from '../../layout/header/header';
import { FooterComponent } from '../../layout/footer/footer';
import { AuthService } from '../../core/services/auth.service';
import { Profile, ShippingAddress, UserProfileData } from '../../core/services/supabase.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, FooterComponent],
  templateUrl: './profile.html',
  styleUrls: ['./profile.scss']
})
export class ProfileComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // State management
  loading = false;
  error: string | null = null;
  success: string | null = null;
  
  // Profile data
  profile: Profile | null = null;
  addresses: ShippingAddress[] = [];
  
  // Form data
  profileForm = {
    full_name: '',
    email: '',
    phone: '',
    date_of_birth: ''
  };
  
  // Address form
  addressForm = {
    title: '',
    first_name: '',
    last_name: '',
    company: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
    phone: '',
    is_default: false
  };
  
  // UI state
  activeTab: 'personal' | 'addresses' | 'orders' = 'personal';
  showAddressForm = false;
  editingAddressId: string | null = null;
  
  // Address titles for dropdown
  addressTitles = ['Casa', 'Oficina', 'Casa de mis padres', 'Otro'];
  
  // States/Provinces by country
  statesByCountry: { [key: string]: string[] } = {
    'España': [
      'Andalucía', 'Aragón', 'Asturias', 'Baleares', 'Canarias', 'Cantabria',
      'Castilla-La Mancha', 'Castilla y León', 'Cataluña', 'Ceuta', 'Extremadura',
      'Galicia', 'La Rioja', 'Madrid', 'Melilla', 'Murcia', 'Navarra', 'País Vasco', 'Valencia'
    ],
    'Francia': [
      'Auvergne-Rhône-Alpes', 'Bourgogne-Franche-Comté', 'Bretagne', 'Centre-Val de Loire',
      'Corse', 'Grand Est', 'Hauts-de-France', 'Île-de-France', 'Normandie', 'Nouvelle-Aquitaine',
      'Occitanie', 'Pays de la Loire', 'Provence-Alpes-Côte d\'Azur'
    ],
    'Portugal': [
      'Aveiro', 'Beja', 'Braga', 'Bragança', 'Castelo Branco', 'Coimbra', 'Évora',
      'Faro', 'Guarda', 'Leiria', 'Lisboa', 'Portalegre', 'Porto', 'Santarém',
      'Setúbal', 'Viana do Castelo', 'Vila Real', 'Viseu', 'Azores', 'Madeira'
    ],
    'Italia': [
      'Abruzzo', 'Basilicata', 'Calabria', 'Campania', 'Emilia-Romagna', 'Friuli-Venezia Giulia',
      'Lazio', 'Liguria', 'Lombardia', 'Marche', 'Molise', 'Piemonte', 'Puglia', 'Sardegna',
      'Sicilia', 'Toscana', 'Trentino-Alto Adige', 'Umbria', 'Valle d\'Aosta', 'Veneto'
    ],
    'Alemania': [
      'Baden-Württemberg', 'Bayern', 'Berlin', 'Brandenburg', 'Bremen', 'Hamburg',
      'Hessen', 'Mecklenburg-Vorpommern', 'Niedersachsen', 'Nordrhein-Westfalen',
      'Rheinland-Pfalz', 'Saarland', 'Sachsen', 'Sachsen-Anhalt', 'Schleswig-Holstein', 'Thüringen'
    ],
    'Reino Unido': [
      'England', 'Scotland', 'Wales', 'Northern Ireland'
    ],
    'Estados Unidos': [
      'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
      'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
      'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
      'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
      'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
      'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
      'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
      'Wisconsin', 'Wyoming'
    ],
    'Canadá': [
      'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador',
      'Northwest Territories', 'Nova Scotia', 'Nunavut', 'Ontario', 'Prince Edward Island',
      'Quebec', 'Saskatchewan', 'Yukon'
    ],
    'México': [
      'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas',
      'Chihuahua', 'Coahuila', 'Colima', 'Durango', 'Guanajuato', 'Guerrero', 'Hidalgo',
      'Jalisco', 'México', 'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca',
      'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí', 'Sinaloa', 'Sonora',
      'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas'
    ],
    'Argentina': [
      'Buenos Aires', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba', 'Corrientes', 'Entre Ríos',
      'Formosa', 'Jujuy', 'La Pampa', 'La Rioja', 'Mendoza', 'Misiones', 'Neuquén',
      'Río Negro', 'Salta', 'San Juan', 'San Luis', 'Santa Cruz', 'Santa Fe',
      'Santiago del Estero', 'Tierra del Fuego', 'Tucumán'
    ],
    'Perú': [
      'Amazonas', 'Áncash', 'Apurímac', 'Arequipa', 'Ayacucho', 'Cajamarca', 'Callao',
      'Cusco', 'Huancavelica', 'Huánuco', 'Ica', 'Junín', 'La Libertad', 'Lambayeque',
      'Lima', 'Loreto', 'Madre de Dios', 'Moquegua', 'Pasco', 'Piura', 'Puno',
      'San Martín', 'Tacna', 'Tumbes', 'Ucayali'
    ],
    'Chile': [
      'Arica y Parinacota', 'Tarapacá', 'Antofagasta', 'Atacama', 'Coquimbo', 'Valparaíso',
      'Metropolitana de Santiago', 'O\'Higgins', 'Maule', 'Ñuble', 'Biobío', 'La Araucanía',
      'Los Ríos', 'Los Lagos', 'Aysén', 'Magallanes y de la Antártica Chilena'
    ],
    'Colombia': [
      'Amazonas', 'Antioquia', 'Arauca', 'Atlántico', 'Bolívar', 'Boyacá', 'Caldas',
      'Caquetá', 'Casanare', 'Cauca', 'Cesar', 'Chocó', 'Córdoba', 'Cundinamarca',
      'Guainía', 'Guaviare', 'Huila', 'La Guajira', 'Magdalena', 'Meta', 'Nariño',
      'Norte de Santander', 'Putumayo', 'Quindío', 'Risaralda', 'San Andrés y Providencia',
      'Santander', 'Sucre', 'Tolima', 'Valle del Cauca', 'Vaupés', 'Vichada'
    ],
    'Brasil': [
      'Acre', 'Alagoas', 'Amapá', 'Amazonas', 'Bahia', 'Ceará', 'Distrito Federal',
      'Espírito Santo', 'Goiás', 'Maranhão', 'Mato Grosso', 'Mato Grosso do Sul',
      'Minas Gerais', 'Pará', 'Paraíba', 'Paraná', 'Pernambuco', 'Piauí',
      'Rio de Janeiro', 'Rio Grande do Norte', 'Rio Grande do Sul', 'Rondônia',
      'Roraima', 'Santa Catarina', 'São Paulo', 'Sergipe', 'Tocantins'
    ]
  };

  // Available countries for shipping
  availableCountries = [
    'España',
    'Francia',
    'Portugal',
    'Italia',
    'Alemania',
    'Reino Unido',
    'Países Bajos',
    'Bélgica',
    'Austria',
    'Suiza',
    'Andorra',
    'Mónaco',
    'Estados Unidos',
    'Canadá',
    'México',
    'Argentina',
    'Chile',
    'Colombia',
    'Perú',
    'Brasil',
    'Australia',
    'Japón'
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  async ngOnInit() {
    await this.loadProfileData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async loadProfileData() {
    console.log('🔄 [PROFILE] Iniciando carga de datos del perfil...');
    this.loading = true;
    this.error = null;

    try {
      console.log('📡 [PROFILE] Llamando a getUserProfileData...');
      const { data, error } = await this.authService.getUserProfileData();

      if (error) {
        console.error('❌ [PROFILE] Error al cargar datos:', error);
        this.error = 'Error al cargar los datos del perfil';
        return;
      }

      if (data) {
        console.log('✅ [PROFILE] Datos cargados exitosamente:', {
          profile: data.profile,
          addressesCount: data.addresses?.length || 0,
          addresses: data.addresses
        });
        
        this.profile = data.profile;
        this.addresses = data.addresses;
        
        // Populate form
        this.profileForm = {
          full_name: data.profile.full_name || '',
          email: data.profile.email || '',
          phone: data.profile.phone || '',
          date_of_birth: data.profile.date_of_birth || ''
        };

        console.log('📝 [PROFILE] Formulario poblado:', this.profileForm);
      } else {
        console.warn('⚠️ [PROFILE] No se recibieron datos del perfil');
      }
    } catch (error) {
      console.error('💥 [PROFILE] Error inesperado al cargar datos:', error);
      this.error = 'Error al cargar los datos del perfil';
    } finally {
      this.loading = false;
      console.log('🏁 [PROFILE] Carga de datos completada');
    }
  }

  async updateProfile() {
    if (!this.profile) {
      console.warn('⚠️ [PROFILE] No hay perfil para actualizar');
      return;
    }

    console.log('🔄 [PROFILE] Iniciando actualización de perfil...');
    console.log('📝 [PROFILE] Datos a actualizar:', {
      current: this.profile,
      updates: this.profileForm
    });

    this.loading = true;
    this.error = null;
    this.success = null;

    try {
      const updateData = {
        full_name: this.profileForm.full_name,
        phone: this.profileForm.phone,
        date_of_birth: this.profileForm.date_of_birth
      };

      console.log('📡 [PROFILE] Enviando actualización:', updateData);
      const { data, error } = await this.authService.updateProfile(updateData);

      if (error) {
        console.error('❌ [PROFILE] Error al actualizar perfil:', error);
        this.error = 'Error al actualizar el perfil';
        return;
      }

      console.log('✅ [PROFILE] Perfil actualizado exitosamente:', data);
      this.success = 'Perfil actualizado correctamente';
      
      // Reload data to reflect changes
      console.log('🔄 [PROFILE] Recargando datos después de actualización...');
      await this.loadProfileData();
    } catch (error) {
      console.error('💥 [PROFILE] Error inesperado al actualizar perfil:', error);
      this.error = 'Error al actualizar el perfil';
    } finally {
      this.loading = false;
      console.log('🏁 [PROFILE] Actualización de perfil completada');
    }
  }

  // Address management methods
  openAddressForm() {
    this.showAddressForm = true;
    this.editingAddressId = null;
    this.resetAddressForm();
  }

  editAddress(address: ShippingAddress) {
    this.showAddressForm = true;
    this.editingAddressId = address.id;
    this.addressForm = {
      title: address.title,
      first_name: address.first_name,
      last_name: address.last_name,
      company: address.company || '',
      address_line_1: address.address_line_1,
      address_line_2: address.address_line_2 || '',
      city: address.city,
      state: address.state,
      postal_code: address.postal_code,
      country: address.country,
      phone: address.phone || '',
      is_default: address.is_default
    };
  }

  async saveAddress() {
    console.log('🔄 [ADDRESS] Iniciando guardado de dirección...');
    console.log('📝 [ADDRESS] Datos de dirección:', {
      isEditing: !!this.editingAddressId,
      addressId: this.editingAddressId,
      formData: this.addressForm
    });

    this.loading = true;
    this.error = null;
    this.success = null;

    try {
      if (this.editingAddressId) {
        console.log('📡 [ADDRESS] Actualizando dirección existente...');
        // Update existing address
        const { error } = await this.authService.updateShippingAddress(
          this.editingAddressId,
          this.addressForm
        );

        if (error) {
          console.error('❌ [ADDRESS] Error al actualizar dirección:', error);
          this.error = 'Error al actualizar la dirección';
          return;
        }

        console.log('✅ [ADDRESS] Dirección actualizada exitosamente');
        this.success = 'Dirección actualizada correctamente';
      } else {
        console.log('📡 [ADDRESS] Creando nueva dirección...');
        // Create new address
        const { error } = await this.authService.createShippingAddress(this.addressForm);

        if (error) {
          console.error('❌ [ADDRESS] Error al crear dirección:', error);
          this.error = 'Error al crear la dirección';
          return;
        }

        console.log('✅ [ADDRESS] Dirección creada exitosamente');
        this.success = 'Dirección creada correctamente';
      }

      this.showAddressForm = false;
      console.log('🔄 [ADDRESS] Recargando datos después de guardar...');
      await this.loadProfileData();
    } catch (error) {
      console.error('💥 [ADDRESS] Error inesperado al guardar dirección:', error);
      this.error = 'Error al guardar la dirección';
    } finally {
      this.loading = false;
      console.log('🏁 [ADDRESS] Guardado de dirección completado');
    }
  }

  async deleteAddress(addressId: string) {
    console.log('🔄 [ADDRESS] Iniciando eliminación de dirección:', addressId);
    
    if (!confirm('¿Estás seguro de que quieres eliminar esta dirección?')) {
      console.log('❌ [ADDRESS] Eliminación cancelada por el usuario');
      return;
    }

    this.loading = true;
    this.error = null;
    this.success = null;

    try {
      console.log('📡 [ADDRESS] Enviando solicitud de eliminación...');
      const { error } = await this.authService.deleteShippingAddress(addressId);

      if (error) {
        console.error('❌ [ADDRESS] Error al eliminar dirección:', error);
        this.error = 'Error al eliminar la dirección';
        return;
      }

      console.log('✅ [ADDRESS] Dirección eliminada exitosamente');
      this.success = 'Dirección eliminada correctamente';
      
      console.log('🔄 [ADDRESS] Recargando datos después de eliminar...');
      await this.loadProfileData();
    } catch (error) {
      console.error('💥 [ADDRESS] Error inesperado al eliminar dirección:', error);
      this.error = 'Error al eliminar la dirección';
    } finally {
      this.loading = false;
      console.log('🏁 [ADDRESS] Eliminación de dirección completada');
    }
  }

  async setDefaultAddress(addressId: string) {
    console.log('🔄 [ADDRESS] Estableciendo dirección por defecto:', addressId);
    
    this.loading = true;
    this.error = null;
    this.success = null;

    try {
      console.log('📡 [ADDRESS] Enviando solicitud de dirección por defecto...');
      const { error } = await this.authService.setDefaultShippingAddress(addressId);

      if (error) {
        console.error('❌ [ADDRESS] Error al establecer dirección por defecto:', error);
        this.error = 'Error al establecer dirección por defecto';
        return;
      }

      console.log('✅ [ADDRESS] Dirección por defecto establecida exitosamente');
      this.success = 'Dirección por defecto actualizada';
      
      console.log('🔄 [ADDRESS] Recargando datos después de establecer por defecto...');
      await this.loadProfileData();
    } catch (error) {
      console.error('💥 [ADDRESS] Error inesperado al establecer dirección por defecto:', error);
      this.error = 'Error al establecer dirección por defecto';
    } finally {
      this.loading = false;
      console.log('🏁 [ADDRESS] Establecimiento de dirección por defecto completado');
    }
  }

  cancelAddressForm() {
    this.showAddressForm = false;
    this.editingAddressId = null;
    this.resetAddressForm();
  }

  private resetAddressForm() {
    console.log('🔄 [ADDRESS] Reseteando formulario de dirección...');
    this.addressForm = {
      title: '',
      first_name: '',
      last_name: '',
      company: '',
      address_line_1: '',
      address_line_2: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'España', // Default to Spain but allow selection
      phone: '',
      is_default: false
    };
    console.log('✅ [ADDRESS] Formulario reseteado');
  }

  // Utility methods
  clearMessages() {
    this.error = null;
    this.success = null;
  }

  setActiveTab(tab: 'personal' | 'addresses' | 'orders') {
    this.activeTab = tab;
    this.clearMessages();
  }

  getDefaultAddress(): ShippingAddress | null {
    return this.addresses.find(addr => addr.is_default) || null;
  }

  formatAddress(address: ShippingAddress): string {
    let formatted = `${address.address_line_1}`;
    if (address.address_line_2) {
      formatted += `, ${address.address_line_2}`;
    }
    formatted += `, ${address.city}, ${address.state} ${address.postal_code}, ${address.country}`;
    return formatted;
  }

  // Navigation methods
  goToOrders() {
    this.router.navigate(['/orders']);
  }

  // Get states/provinces for selected country
  getStatesForCountry(country: string): string[] {
    return this.statesByCountry[country] || [];
  }

  // Check if country has predefined states
  hasStatesForCountry(country: string): boolean {
    return this.statesByCountry.hasOwnProperty(country) && this.statesByCountry[country].length > 0;
  }

  // Handle country change in address form
  onCountryChange() {
    console.log('🔄 [ADDRESS] País cambiado a:', this.addressForm.country);
    // Reset state when country changes
    this.addressForm.state = '';
    console.log('✅ [ADDRESS] Estado/Provincia reseteado');
  }
} 